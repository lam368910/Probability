// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BinaryPredictionMarket} from "./BinaryPredictionMarket.sol";

/// @title ProbabilityMarketFactory
/// @notice Minimal deployment registry for independently administered binary markets.
/// @dev UNAUDITED. The factory is intentionally non-upgradeable.
contract ProbabilityMarketFactory {
    uint256 public constant MAX_QUESTION_BYTES = 512;
    uint256 public constant MAX_PAGE_SIZE = 100;
    uint16 public constant MAX_FEE_BPS = 1_000;
    uint16 public constant MAX_PROTOCOL_FEE_SHARE_BPS = 5_000;

    address public owner;
    address public pendingOwner;
    bool public permissionlessCreation;
    address public protocolTreasury;
    uint16 public protocolFeeShareBps;

    address[] private _markets;
    mapping(address => bool) public isMarket;

    error Unauthorized();
    error ZeroAddress();
    error InvalidCollateral();
    error InvalidQuestion();
    error InvalidCloseTime();
    error InvalidFee();
    error InvalidProtocolFeeShare();
    error InvalidMinimumReserve();
    error InvalidPagination();

    event OwnershipTransferStarted(address indexed previousOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CreationPolicyUpdated(bool permissionlessCreation);
    event ProtocolFeeConfigUpdated(address indexed treasury, uint16 feeShareBps);
    event MarketCreated(
        address indexed market,
        address indexed creator,
        address indexed collateral,
        address marketOwner,
        address oracle,
        uint64 closeTime,
        uint16 feeBps,
        uint16 protocolFeeShareBps,
        address protocolTreasury,
        uint256 minimumReserve,
        string question
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address owner_, address protocolTreasury_, uint16 protocolFeeShareBps_) {
        if (owner_ == address(0) || protocolTreasury_ == address(0)) revert ZeroAddress();
        if (protocolFeeShareBps_ > MAX_PROTOCOL_FEE_SHARE_BPS) revert InvalidProtocolFeeShare();
        owner = owner_;
        protocolTreasury = protocolTreasury_;
        protocolFeeShareBps = protocolFeeShareBps_;
        emit OwnershipTransferred(address(0), owner_);
        emit ProtocolFeeConfigUpdated(protocolTreasury_, protocolFeeShareBps_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, msg.sender);
    }

    function setPermissionlessCreation(bool value) external onlyOwner {
        permissionlessCreation = value;
        emit CreationPolicyUpdated(value);
    }

    /// @notice Updates revenue terms for future markets only. Existing markets are immutable.
    function setProtocolFeeConfig(address treasury, uint16 feeShareBps) external onlyOwner {
        if (treasury == address(0)) revert ZeroAddress();
        if (feeShareBps > MAX_PROTOCOL_FEE_SHARE_BPS) revert InvalidProtocolFeeShare();
        protocolTreasury = treasury;
        protocolFeeShareBps = feeShareBps;
        emit ProtocolFeeConfigUpdated(treasury, feeShareBps);
    }

    function createMarket(
        address collateral,
        string calldata question,
        uint64 closeTime,
        uint16 feeBps,
        uint256 minimumReserve,
        address oracle,
        address marketOwner
    ) external returns (address market) {
        if (!permissionlessCreation && msg.sender != owner) revert Unauthorized();
        if (collateral == address(0) || oracle == address(0) || marketOwner == address(0)) revert ZeroAddress();
        if (collateral.code.length == 0) revert InvalidCollateral();
        uint256 questionLength = bytes(question).length;
        if (questionLength == 0 || questionLength > MAX_QUESTION_BYTES) revert InvalidQuestion();
        if (closeTime <= block.timestamp) revert InvalidCloseTime();
        if (feeBps > MAX_FEE_BPS) revert InvalidFee();
        if (minimumReserve == 0) revert InvalidMinimumReserve();

        market = address(
            new BinaryPredictionMarket(
                collateral,
                question,
                closeTime,
                feeBps,
                protocolFeeShareBps,
                minimumReserve,
                protocolTreasury,
                oracle,
                marketOwner
            )
        );
        _markets.push(market);
        isMarket[market] = true;

        emit MarketCreated(
            market,
            msg.sender,
            collateral,
            marketOwner,
            oracle,
            closeTime,
            feeBps,
            protocolFeeShareBps,
            protocolTreasury,
            minimumReserve,
            question
        );
    }

    function marketCount() external view returns (uint256) {
        return _markets.length;
    }

    function marketAt(uint256 index) external view returns (address) {
        return _markets[index];
    }

    /// @notice Returns a bounded registry page. An offset at the end returns an empty page.
    function getMarkets(uint256 offset, uint256 limit) external view returns (address[] memory page) {
        uint256 length = _markets.length;
        if (offset > length || limit > MAX_PAGE_SIZE) revert InvalidPagination();
        uint256 end = offset + limit;
        if (end > length) end = length;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            page[i - offset] = _markets[i];
        }
    }
}
