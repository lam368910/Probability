// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Minimal ERC-20 interface. The market supports standard, non-rebasing tokens only.
interface IERC20Collateral {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title BinaryPredictionMarket
/// @notice Fully collateralized binary fixed-product market with internal outcome and LP shares.
/// @dev UNAUDITED. Intended for testnets and review, not production custody.
contract BinaryPredictionMarket {
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10%
    uint256 public constant MAX_PROTOCOL_FEE_SHARE_BPS = 5_000; // at most 50% of trading fees

    enum Phase {
        Funding,
        Trading,
        Resolved
    }

    IERC20Collateral public immutable collateral;
    uint64 public immutable closeTime;
    uint16 public immutable feeBps;
    uint16 public immutable protocolFeeShareBps;
    uint256 public immutable minimumReserve;
    address public immutable protocolTreasury;
    string public question;

    address public owner;
    address public pendingOwner;
    address public oracle;
    bool public paused;
    bool public initialized;
    bool public resolved;
    bool public invalid;
    bool public winningOutcome;

    uint256 public yesReserve;
    uint256 public noReserve;
    uint256 public totalYesShares;
    uint256 public totalNoShares;
    uint256 public totalLpShares;
    uint256 public accruedFees;
    uint256 public accruedProtocolFees;

    mapping(address => uint256) public yesBalance;
    mapping(address => uint256) public noBalance;
    mapping(address => uint256) public lpBalance;

    uint256 private _locked = 1;

    error Unauthorized();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidFee();
    error InvalidProtocolFeeShare();
    error InvalidCloseTime();
    error InvalidQuestion();
    error InvalidPhase();
    error Paused();
    error AlreadyInitialized();
    error InsufficientBalance();
    error Slippage();
    error DeadlineExpired();
    error InsufficientLiquidity();
    error MinimumReserve();
    error UnsupportedToken();
    error TransferFailed();
    error Reentrancy();
    error Insolvent();

    event OwnershipTransferStarted(address indexed previousOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OracleUpdated(address indexed previousOracle, address indexed newOracle);
    event PauseUpdated(bool paused);
    event ProtocolFeesClaimed(address indexed treasury, uint256 amount);
    event MarketInitialized(address indexed provider, uint256 collateralAmount, uint256 lpShares);
    event LiquidityAdded(
        address indexed provider,
        uint256 collateralAmount,
        uint256 lpShares,
        uint256 yesSharesReturned,
        uint256 noSharesReturned
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 lpShares,
        uint256 collateralPaid,
        uint256 yesSharesReceived,
        uint256 noSharesReceived,
        uint256 feesPaid
    );
    event Bought(
        address indexed trader,
        bool indexed outcome,
        uint256 collateralIn,
        uint256 fee,
        uint256 sharesOut
    );
    event Sold(
        address indexed trader,
        bool indexed outcome,
        uint256 sharesIn,
        uint256 collateralOut,
        uint256 fee
    );
    event MarketResolved(bool indexed winningOutcome, address indexed oracle);
    event MarketInvalidated(address indexed oracle);
    event Redeemed(address indexed account, bool indexed outcome, uint256 shares, uint256 collateralOut);
    event InvalidPositionRedeemed(
        address indexed account,
        uint256 yesShares,
        uint256 noShares,
        uint256 collateralOut
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    constructor(
        address collateral_,
        string memory question_,
        uint64 closeTime_,
        uint16 feeBps_,
        uint16 protocolFeeShareBps_,
        uint256 minimumReserve_,
        address protocolTreasury_,
        address oracle_,
        address owner_
    ) {
        if (
            collateral_ == address(0) || protocolTreasury_ == address(0)
                || oracle_ == address(0) || owner_ == address(0)
        ) revert ZeroAddress();
        if (bytes(question_).length == 0) revert InvalidQuestion();
        if (closeTime_ <= block.timestamp) revert InvalidCloseTime();
        if (feeBps_ > MAX_FEE_BPS) revert InvalidFee();
        if (protocolFeeShareBps_ > MAX_PROTOCOL_FEE_SHARE_BPS) revert InvalidProtocolFeeShare();
        if (minimumReserve_ == 0) revert MinimumReserve();
        collateral = IERC20Collateral(collateral_);
        question = question_;
        closeTime = closeTime_;
        feeBps = feeBps_;
        protocolFeeShareBps = protocolFeeShareBps_;
        minimumReserve = minimumReserve_;
        protocolTreasury = protocolTreasury_;
        oracle = oracle_;
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
        emit OracleUpdated(address(0), oracle_);
    }

    function phase() external view returns (Phase) {
        if (resolved) return Phase.Resolved;
        if (!initialized) return Phase.Funding;
        return Phase.Trading;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        address previous = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit OwnershipTransferred(previous, msg.sender);
    }

    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();
        address previous = oracle;
        oracle = newOracle;
        emit OracleUpdated(previous, newOracle);
    }

    function setPaused(bool value) external onlyOwner {
        paused = value;
        emit PauseUpdated(value);
    }

    /// @notice Pays the immutable treasury its accumulated share of trading fees.
    function claimProtocolFees() external nonReentrant returns (uint256 amount) {
        if (msg.sender != protocolTreasury) revert Unauthorized();
        amount = accruedProtocolFees;
        if (amount == 0) revert ZeroAmount();
        accruedProtocolFees = 0;
        _push(protocolTreasury, amount);
        _assertSolvent();
        emit ProtocolFeesClaimed(protocolTreasury, amount);
    }

    /// @notice Seeds equal YES/NO reserves. The initializer receives one LP share per collateral unit.
    function initialize(uint256 collateralAmount) external nonReentrant whenNotPaused {
        if (initialized) revert AlreadyInitialized();
        if (block.timestamp >= closeTime) revert InvalidPhase();
        if (collateralAmount < minimumReserve) revert MinimumReserve();
        initialized = true;
        yesReserve = collateralAmount;
        noReserve = collateralAmount;
        totalYesShares = collateralAmount;
        totalNoShares = collateralAmount;
        totalLpShares = collateralAmount;
        lpBalance[msg.sender] = collateralAmount;
        _pullExact(msg.sender, collateralAmount);
        _assertSolvent();
        emit MarketInitialized(msg.sender, collateralAmount, collateralAmount);
    }

    /// @notice Adds liquidity without moving the current price. Unequal excess outcome shares go to the LP.
    function addLiquidity(
        uint256 collateralAmount,
        uint256 minLpShares,
        uint256 minYesReturned,
        uint256 minNoReturned,
        uint256 deadline
    )
        external
        nonReentrant
        whenNotPaused
        returns (uint256 lpShares, uint256 yesReturned, uint256 noReturned)
    {
        _requireTrading(deadline);
        if (collateralAmount == 0) revert ZeroAmount();

        uint256 largestReserve = yesReserve > noReserve ? yesReserve : noReserve;
        lpShares = _mulDiv(collateralAmount, totalLpShares, largestReserve);
        if (lpShares == 0 || lpShares < minLpShares) revert Slippage();

        uint256 yesAdded = _mulDiv(yesReserve, lpShares, totalLpShares);
        uint256 noAdded = _mulDiv(noReserve, lpShares, totalLpShares);
        yesReturned = collateralAmount - yesAdded;
        noReturned = collateralAmount - noAdded;
        if (yesReturned < minYesReturned || noReturned < minNoReturned) revert Slippage();

        yesReserve += yesAdded;
        noReserve += noAdded;
        totalYesShares += collateralAmount;
        totalNoShares += collateralAmount;
        totalLpShares += lpShares;
        lpBalance[msg.sender] += lpShares;
        yesBalance[msg.sender] += yesReturned;
        noBalance[msg.sender] += noReturned;

        _pullExact(msg.sender, collateralAmount);
        _assertSolvent();
        emit LiquidityAdded(msg.sender, collateralAmount, lpShares, yesReturned, noReturned);
    }

    /// @notice Burns LP shares. Before resolution, paired outcomes are merged and imbalance is returned as shares.
    /// After resolution, the provider receives its pro-rata winning reserve directly as collateral.
    function removeLiquidity(
        uint256 lpShares,
        uint256 minCollateralOut,
        uint256 minYesReceived,
        uint256 minNoReceived,
        uint256 deadline
    )
        external
        nonReentrant
        returns (uint256 collateralOut, uint256 yesReceived, uint256 noReceived)
    {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (lpShares == 0) revert ZeroAmount();
        if (lpBalance[msg.sender] < lpShares) revert InsufficientBalance();

        uint256 supply = totalLpShares;
        uint256 yesOut = _mulDiv(yesReserve, lpShares, supply);
        uint256 noOut = _mulDiv(noReserve, lpShares, supply);
        uint256 feeOut = _mulDiv(accruedFees, lpShares, supply);

        lpBalance[msg.sender] -= lpShares;
        totalLpShares = supply - lpShares;
        yesReserve -= yesOut;
        noReserve -= noOut;
        accruedFees -= feeOut;

        if (resolved) {
            if (invalid) {
                collateralOut = (yesOut + noOut) / 2 + feeOut;
            } else {
                uint256 winningOut = winningOutcome ? yesOut : noOut;
                collateralOut = winningOut + feeOut;
            }
            totalYesShares -= yesOut;
            totalNoShares -= noOut;
        } else {
            if (yesReserve < minimumReserve || noReserve < minimumReserve) revert MinimumReserve();
            uint256 paired = yesOut < noOut ? yesOut : noOut;
            collateralOut = paired + feeOut;
            yesReceived = yesOut - paired;
            noReceived = noOut - paired;
            yesBalance[msg.sender] += yesReceived;
            noBalance[msg.sender] += noReceived;
            totalYesShares -= paired;
            totalNoShares -= paired;
        }
        if (
            collateralOut < minCollateralOut || yesReceived < minYesReceived
                || noReceived < minNoReceived
        ) revert Slippage();
        _push(msg.sender, collateralOut);
        _assertSolvent();
        emit LiquidityRemoved(msg.sender, lpShares, collateralOut, yesReceived, noReceived, feeOut);
    }

    function quoteBuy(bool outcome, uint256 collateralIn)
        public
        view
        returns (uint256 sharesOut, uint256 fee)
    {
        fee = _mulDivUp(collateralIn, feeBps, FEE_DENOMINATOR);
        if (fee >= collateralIn) return (0, fee);
        uint256 net = collateralIn - fee;
        uint256 outcomeReserve = outcome ? yesReserve : noReserve;
        uint256 oppositeReserve = outcome ? noReserve : yesReserve;
        uint256 newOpposite = oppositeReserve + net;
        uint256 newOutcome = _mulDivUp(outcomeReserve, oppositeReserve, newOpposite);
        sharesOut = outcomeReserve + net - newOutcome;
    }

    function buy(bool outcome, uint256 collateralIn, uint256 minSharesOut, uint256 deadline)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 sharesOut)
    {
        _requireTrading(deadline);
        if (collateralIn == 0) revert ZeroAmount();
        uint256 fee;
        (sharesOut, fee) = quoteBuy(outcome, collateralIn);
        if (sharesOut == 0 || sharesOut < minSharesOut) revert Slippage();
        uint256 net = collateralIn - fee;

        if (outcome) {
            yesReserve = yesReserve + net - sharesOut;
            noReserve += net;
            if (yesReserve < minimumReserve) revert MinimumReserve();
            yesBalance[msg.sender] += sharesOut;
        } else {
            noReserve = noReserve + net - sharesOut;
            yesReserve += net;
            if (noReserve < minimumReserve) revert MinimumReserve();
            noBalance[msg.sender] += sharesOut;
        }
        totalYesShares += net;
        totalNoShares += net;
        _accrueFee(fee);
        _pullExact(msg.sender, collateralIn);
        _assertSolvent();
        emit Bought(msg.sender, outcome, collateralIn, fee, sharesOut);
    }

    /// @notice Quotes outcome shares required to receive an exact gross collateral amount before fees.
    function quoteSell(bool outcome, uint256 grossCollateralOut)
        public
        view
        returns (uint256 sharesIn, uint256 netCollateralOut, uint256 fee)
    {
        uint256 outcomeReserve = outcome ? yesReserve : noReserve;
        uint256 oppositeReserve = outcome ? noReserve : yesReserve;
        if (grossCollateralOut == 0 || grossCollateralOut >= oppositeReserve) {
            return (type(uint256).max, 0, 0);
        }
        uint256 newOpposite = oppositeReserve - grossCollateralOut;
        uint256 newOutcome = _mulDivUp(outcomeReserve, oppositeReserve, newOpposite);
        sharesIn = newOutcome + grossCollateralOut - outcomeReserve;
        fee = _mulDivUp(grossCollateralOut, feeBps, FEE_DENOMINATOR);
        netCollateralOut = grossCollateralOut - fee;
    }

    function sell(
        bool outcome,
        uint256 grossCollateralOut,
        uint256 maxSharesIn,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 sharesIn, uint256 netCollateralOut) {
        _requireTrading(deadline);
        uint256 fee;
        (sharesIn, netCollateralOut, fee) = quoteSell(outcome, grossCollateralOut);
        if (sharesIn == type(uint256).max || sharesIn > maxSharesIn) revert Slippage();

        if (outcome) {
            if (yesBalance[msg.sender] < sharesIn) revert InsufficientBalance();
            yesBalance[msg.sender] -= sharesIn;
            yesReserve = yesReserve + sharesIn - grossCollateralOut;
            noReserve -= grossCollateralOut;
            if (noReserve < minimumReserve) revert MinimumReserve();
        } else {
            if (noBalance[msg.sender] < sharesIn) revert InsufficientBalance();
            noBalance[msg.sender] -= sharesIn;
            noReserve = noReserve + sharesIn - grossCollateralOut;
            yesReserve -= grossCollateralOut;
            if (yesReserve < minimumReserve) revert MinimumReserve();
        }
        totalYesShares -= grossCollateralOut;
        totalNoShares -= grossCollateralOut;
        _accrueFee(fee);
        _push(msg.sender, netCollateralOut);
        _assertSolvent();
        emit Sold(msg.sender, outcome, sharesIn, netCollateralOut, fee);
    }

    /// @notice Resolves the market after its close time. This is intentionally callable even while paused.
    function resolve(bool winningOutcome_) external onlyOracle {
        if (!initialized || resolved || block.timestamp < closeTime) revert InvalidPhase();
        resolved = true;
        winningOutcome = winningOutcome_;
        _assertSolvent();
        emit MarketResolved(winningOutcome_, msg.sender);
    }

    /// @notice Resolves an ambiguous/cancelled market at 0.5 collateral per YES or NO share.
    function resolveInvalid() external onlyOracle {
        if (!initialized || resolved || block.timestamp < closeTime) revert InvalidPhase();
        resolved = true;
        invalid = true;
        _assertSolvent();
        emit MarketInvalidated(msg.sender);
    }

    /// @notice Redeems winning outcome shares 1:1. Losing shares can simply be left unredeemed.
    function redeem() external nonReentrant returns (uint256 collateralOut) {
        if (!resolved) revert InvalidPhase();
        if (invalid) {
            uint256 yesShares = yesBalance[msg.sender];
            uint256 noShares = noBalance[msg.sender];
            if (yesShares == 0 && noShares == 0) revert ZeroAmount();
            yesBalance[msg.sender] = 0;
            noBalance[msg.sender] = 0;
            totalYesShares -= yesShares;
            totalNoShares -= noShares;
            collateralOut = (yesShares + noShares) / 2;
            _push(msg.sender, collateralOut);
            _assertSolvent();
            emit InvalidPositionRedeemed(msg.sender, yesShares, noShares, collateralOut);
            return collateralOut;
        }
        if (winningOutcome) {
            collateralOut = yesBalance[msg.sender];
            yesBalance[msg.sender] = 0;
            totalYesShares -= collateralOut;
        } else {
            collateralOut = noBalance[msg.sender];
            noBalance[msg.sender] = 0;
            totalNoShares -= collateralOut;
        }
        if (collateralOut == 0) revert ZeroAmount();
        _push(msg.sender, collateralOut);
        _assertSolvent();
        emit Redeemed(msg.sender, winningOutcome, collateralOut, collateralOut);
    }

    /// @notice Conservative liability check for the active or resolved market.
    function requiredCollateral() public view returns (uint256) {
        if (!resolved) {
            return (totalYesShares > totalNoShares ? totalYesShares : totalNoShares)
                + accruedFees + accruedProtocolFees;
        }
        if (invalid) {
            return (totalYesShares + totalNoShares + 1) / 2 + accruedFees + accruedProtocolFees;
        }
        return (winningOutcome ? totalYesShares : totalNoShares) + accruedFees + accruedProtocolFees;
    }

    function _accrueFee(uint256 fee) private {
        uint256 protocolFee = _mulDiv(fee, protocolFeeShareBps, FEE_DENOMINATOR);
        accruedProtocolFees += protocolFee;
        accruedFees += fee - protocolFee;
    }

    function _requireTrading(uint256 deadline) private view {
        if (!initialized || resolved || block.timestamp >= closeTime) revert InvalidPhase();
        if (block.timestamp > deadline) revert DeadlineExpired();
    }

    function _pullExact(address from, uint256 amount) private {
        uint256 beforeBalance = collateral.balanceOf(address(this));
        _callToken(abi.encodeCall(IERC20Collateral.transferFrom, (from, address(this), amount)));
        if (collateral.balanceOf(address(this)) != beforeBalance + amount) revert UnsupportedToken();
    }

    function _push(address to, uint256 amount) private {
        if (amount == 0) return;
        _callToken(abi.encodeCall(IERC20Collateral.transfer, (to, amount)));
    }

    function _callToken(bytes memory data) private {
        (bool success, bytes memory returnData) = address(collateral).call(data);
        if (!success || (returnData.length != 0 && !abi.decode(returnData, (bool)))) revert TransferFailed();
    }

    function _assertSolvent() private view {
        if (collateral.balanceOf(address(this)) < requiredCollateral()) revert Insolvent();
    }

    function _mulDiv(uint256 x, uint256 y, uint256 denominator) private pure returns (uint256) {
        return x * y / denominator;
    }

    function _mulDivUp(uint256 x, uint256 y, uint256 denominator) private pure returns (uint256) {
        if (x == 0 || y == 0) return 0;
        return (x * y - 1) / denominator + 1;
    }
}
