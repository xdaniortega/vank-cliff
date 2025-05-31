// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

contract PayrollManager is ReentrancyGuard, Ownable {
  using SafeERC20 for IERC20;
  /// @dev Variable to store interface from token ERC20 pass on the constructor
  IERC20 public token;
  /// @dev Constant to set the claim frequency in seconds, 1 day default value.
  uint256 private constant CLAIM_FREQUENCY_IN_SECONDS = 86400;
  /// @dev Total vested amount on the contract
  uint256 public payrollSchedulesTotalAmount;

  /// @dev Mapping to bound PayrollScheduleId to PayrollSchedule struct
  mapping(bytes32 => PayrollSchedule) public payrollSchedules;
  /// @dev Mapping of holder to array of Payroll schedules id
  mapping(address => bytes32[]) public holderAddrToPayrollsId;
  /// @dev List to save created Payroll schedule ids
  bytes32[] public payrollSchedulesIds;

  constructor(address tokenAddress, address newOwner) Ownable(newOwner) {
    if (tokenAddress == address(0)) {
      revert AddressCannotBeZero();
    }
    token = IERC20(tokenAddress);
  }

  receive() external payable {
    emit EthDeposited(msg.sender, msg.value);
  }

  /**
   * @notice Creates a new Payroll schedule for a beneficiary.
   * @param _phaseName a string identifier for the Payroll schedule, can be anything
   * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param _start start time of the Payroll period
   * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param _duration duration in seconds of the period in which the tokens will vest
   * @param _claimFrequencyInSeconds the frequency which the beneficiary will be able to claim
   * @param _amount total amount of tokens to be released at the end of the Payroll
   */
  function createPayrollSchedule(
    string memory _phaseName,
    address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration,
    uint256 _claimFrequencyInSeconds,
    uint256 _amount
  ) external onlyAdminRole returns (bytes32 payrollId) {
    if (payrollSchedulesTotalAmount + _amount > token.balanceOf(address(this))) {
      revert notEnoughFunds();
    }
    payrollSchedulesTotalAmount += _amount;

    return
      _createPayrollSchedule(
        _phaseName,
        _beneficiary,
        _start,
        _cliff,
        _duration,
        _claimFrequencyInSeconds,
        _amount
      );
  }

  function createBatchPayrollSchedule(
    string[] memory _phaseName,
    address[] memory _beneficiary,
    uint256[] memory _start,
    uint256[] memory _cliff,
    uint256[] memory _duration,
    uint256[] memory _claimFrequencyInSeconds,
    uint256[] memory _amount
  ) external onlyAdminRole returns (bytes32[] memory) {
    uint256 length = _phaseName.length;
    bytes32[] memory payrollIds = new bytes32[](length);

    if (
      _beneficiary.length != length ||
      _start.length != length ||
      _cliff.length != length ||
      _duration.length != length ||
      _claimFrequencyInSeconds.length != length ||
      _amount.length != length
    ) {
      revert ArraysMustHaveSameLength();
    }

    for (uint256 i; i < length; ) {
      if (payrollSchedulesTotalAmount + _amount[i] > token.balanceOf(address(this))) {
        revert notEnoughFunds();
      }
      payrollSchedulesTotalAmount += _amount[i];

      payrollIds[i] = _createPayrollSchedule(
        _phaseName[i],
        _beneficiary[i],
        _start[i],
        _cliff[i],
        _duration[i],
        _claimFrequencyInSeconds[i],
        _amount[i]
      );

      unchecked {
        ++i;
      }
    }
    return payrollIds;
  }

  /**
   * @dev Release vested amount of tokens.
   * @param _PayrollId the Payroll schedule identifier
   */
  function release(bytes32 _payrollId) external nonReentrant {
    PayrollSchedule storage payrollSchedule = payrollSchedules[_payrollId];
    uint256 currentTime = block.timestamp;
    if (_msgSender() != payrollSchedule.beneficiary && !hasRole(ADMIN_ROLE, _msgSender())) {
      revert OnlyBeneficiaryOrOwnerCanReleaseVestedTokens();
    }

    uint256 claimable = _calculateVestedAmount(payrollSchedule, currentTime);
    if (claimable == 0) {
      revert AllTokensVested();
    }
    payrollSchedule.released += claimable;
    payrollSchedule.lastClaimDate = currentTime;
    payrollSchedulesTotalAmount -= claimable;

    token.safeTransfer(payrollSchedule.beneficiary, claimable);

    emit OnClaim(_payrollId, payrollSchedule.beneficiary, payrollSchedulesTotalAmount);
  }

  /**
   * @notice Calculates the vested token amount for a specific schedule at a given timestamp
   * @dev Considers:
   *      - Payroll schedule existence validation
   *      - Cliff period
   *      - Already released tokens
   *      - Claim intervals
   * @param _payrollsScheduleId Identifier of the Payroll schedule
   * @param _referenceTimestamp Timestamp for which vested amount is calculated
   * @return uint256 Amount of tokens that can be claimed:
   *         - 0 if in cliff period
   *         - amountTotal - released if Payroll has ended
   *         - Proportional amount based on intervals if in progress
   * @custom:truncate Calculations are truncated to the last complete claim interval
   */
  function calculateVestedAmount(
    bytes32 _payrollsScheduleId,
    uint256 _referenceTimestamp
  ) public view returns (uint256) {
    PayrollSchedule memory _payroll = payrollSchedules[_payrollsScheduleId];
    return _calculateVestedAmount(_payroll, _referenceTimestamp);
  }

  /**
   * @notice Function to compute the Payroll schedule identifier
   * @param _Payroll Payroll schedule structure
   * @return bytes32 Computed Payroll schedule identifier
   */
  function computePayrollId(PayrollSchedule memory _payroll) public pure returns (bytes32) {
    return keccak256(abi.encode(_payroll));
  }

  function getHolderPayrollCount(address holder) public view returns (uint256) {
    return holderAddrToPayrollsId[holder].length;
  }

  function getPayrollSchedule(bytes32 payrollId) public view returns (PayrollSchedule memory) {
    return payrollSchedules[payrollId];
  }

  function getPayrollListByHolder(address holder) public view returns (PayrollSchedule[] memory) {
    PayrollSchedule[] memory payrollsByUser = new PayrollSchedule[](
      holderAddrToPayrollsId[holder].length
    );
    for (uint256 i; i < holderAddrToPayrollsId[holder].length; ) {
      payrollsByUser[i] = payrollSchedules[holderAddrToPayrollsId[holder][i]];
      unchecked {
        ++i;
      }
    }
    return payrollsByUser;
  }

  /// INTERNAL FUNCTIONS
  function _computePayrollId(PayrollSchedule memory _payroll) internal pure returns (bytes32) {
    return keccak256(abi.encode(_payroll));
  }

  function _createPayrollSchedule(
    string memory _phaseName,
    address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration,
    uint256 _claimFrequencyInSeconds,
    uint256 _amount
  ) internal returns (bytes32 payrollId) {
    if (_duration == 0) {
      revert DurationMustBeGreaterThanZero();
    }
    if (_amount == 0) {
      revert AmountMustBeGreaterThanZero();
    }
    if (_cliff > _duration) {
      revert invalidCliff();
    }
    if (_start < block.timestamp) {
      revert invalidStartTimestamp();
    }
    if (_claimFrequencyInSeconds == 0 || _duration <= _claimFrequencyInSeconds) {
      _claimFrequencyInSeconds = CLAIM_FREQUENCY_IN_SECONDS;
    }

    PayrollSchedule memory payrollSchedule = PayrollSchedule(
      _phaseName,
      _beneficiary,
      _cliff,
      _start,
      _duration,
      _amount,
      _claimFrequencyInSeconds,
      0,
      0,
      false
    );

    bytes32 payrollScheduleId = _computePayrollId(payrollSchedule);

    if (payrollSchedules[payrollScheduleId].beneficiary != address(0)) {
      revert PayrollAlreadyExists();
    }

    payrollSchedules[payrollScheduleId] = payrollSchedule;
    holderAddrToPayrollsId[_beneficiary].push(payrollScheduleId);
    payrollSchedulesIds.push(payrollScheduleId);

    emit CreatedPayrollSchedule(payrollScheduleId, _beneficiary, payrollSchedulesTotalAmount);

    return payrollScheduleId;
  }

  /**
   * @notice Calculates the vested token amount for a specific schedule at a given timestamp
   * @dev Considers:
   *      - Payroll schedule existence validation
   *      - Cliff period
   *      - Already released tokens
   *      - Claim intervals
   * @param _Payroll Structure containing the complete Payroll schedule information
   * @param _referenceTimestamp Timestamp for which vested amount is calculated
   * @return uint256 Amount of tokens that can be claimed:
   *         - 0 if in cliff period
   *         - amountTotal - released if Payroll has ended
   *         - Proportional amount based on intervals if in progress
   * @custom:truncate Calculations are truncated to the last complete claim interval
   */
  function _calculateVestedAmount(
    PayrollSchedule memory _payroll,
    uint256 _referenceTimestamp
  ) internal pure returns (uint256) {
    if (_payroll.beneficiary == address(0)) {
      revert PayrollScheduleNotExist();
    }
    uint256 PayrollStart;

    if (_payroll.cliff > 0) {
      PayrollStart = _payroll.start + _payroll.cliff;
    } else {
      PayrollStart = _payroll.start;
    }

    if (PayrollStart > _referenceTimestamp) {
      return 0; //Nothing to vest
    }

    // Has the Payroll ended? Then return what hasn't been claimed yet.
    uint256 endTimestamp = PayrollStart + _payroll.duration;
    if (_referenceTimestamp >= endTimestamp) {
      return _payroll.amountTotal - _payroll.released;
    }

    // Calculate the disposable amount to vest following release interval rules.
    // Has the Payroll started? If so, calculate the vested amount linearly
    uint256 allIntervals = _payroll.duration / _payroll.claimFrequencyInSeconds;
    uint256 rewardPerInterval = _payroll.amountTotal / allIntervals;
    uint256 currentPayrollDuration = _referenceTimestamp - PayrollStart;

    // Round up rcurrentPayrollDuration to latest release interval
    uint256 truncatedCurrentPayrollIntervals = (currentPayrollDuration /
      _payroll.claimFrequencyInSeconds);

    // The maximum we can claim is from beggining to currentInterval calculate before
    uint256 maxToVest = rewardPerInterval * truncatedCurrentPayrollIntervals;

    return maxToVest - _payroll.released;
  }
}
