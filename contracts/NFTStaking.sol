// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./Collection.sol";

contract NFTStaking is Ownable, ERC721Holder {
    // user deposits are recorded in StakeInfo[] stakes struct
    struct StakeInfo {
        // staked is true if token is staked and hasn't been unstaked.
        // After user claims his stake back, `staked` becomes false
        bool staked;
        // address of staked token's owner
        address stakerAddress;
        // time of start staking token
        uint256 lastUpdateTime;
        // totalYield is a total value of rewards for the given stake.
        // user is able to withdraw yield.
        uint256 totalYield;
        // The amount of yield user already harvested
        uint256 harvestedYield;
    }

    // If stakesOpen == true, the contract is operational and accepts new stakes.
    // Otherwise it allows just harvesting and unstaking.
    bool public stakesOpen;

    // Token used for rewards
    IERC20 public nftlToken;

    // The token accepted for staking
    Collection public heroesToken;

    // struccture that stores the records of users' stakes
    mapping(uint256 => StakeInfo) public stakes;
    // struccture that stores the records of users' staked tokens
    mapping(address => uint256[]) public stakedTokens;

    // Base reward that staker will receive for his stake
    uint256 public baseRewardPerSecond;

    event Stake(address indexed user, uint256 indexed tokenId);
    event Unstake(address indexed user, uint256 indexed tokenId);
    event Harvest(address indexed user, uint256 indexed tokenId, uint256 amount);

    /**
     * @dev the constructor arguments:
     * @param _nftlAddress address of token - the same used to pay rewards
     * @param _heroesAddress address of token - the same accepted for staking
     */
    constructor(address _nftlAddress, address _heroesAddress) {
        require(_nftlAddress != address(0), "Empty NFTL token address");
        require(_heroesAddress != address(0), "Empty heroes address");
        nftlToken = IERC20(_nftlAddress);
        heroesToken = Collection(_heroesAddress);
    }

    /**
     * @dev start accepting new stakes. Called only by the owner
     */
    function start() public onlyOwner {
        require(!stakesOpen, "Stakes are open already");
        stakesOpen = true;
    }

    /**
     * @dev stop accepting new stakes. Called only by the owner
     */
    function stop() public onlyOwner {
        require(stakesOpen, "Stakes are stopped already");
        stakesOpen = false;
    }

    /**
     * @dev set base reward for tokens
     * @param _baseRewardPerSecond  base reward in second
     */

    function setBaseRewardPerSecond(uint256 _baseRewardPerSecond) public onlyOwner {
        require(_baseRewardPerSecond > 0, "Zero reward");
        baseRewardPerSecond = _baseRewardPerSecond;
    }

    /**
     * @dev the owner is able to withdraw excess tokens
     * @param _to  address who will receive the funds
     * @param _amount amount of tokens in atto (1e-18) units
     */

    function withdrawNftl(address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Empty receiver address");
        require(_amount > 0, "Zero amount");
        require(nftlToken.balanceOf(address(this)) >= _amount, "Not enough tokens");
        nftlToken.transfer(_to, _amount);
    }

    /**
     * @dev submit the stake
     * @param _tokenId id of hero token
     */
    function stake(uint256 _tokenId) external {
        require(stakesOpen, "stake: not open");
        stakes[_tokenId].staked = true;
        stakes[_tokenId].stakerAddress = msg.sender;
        stakes[_tokenId].lastUpdateTime = block.timestamp;
        stakedTokens[msg.sender].push(_tokenId);
        emit Stake(msg.sender, _tokenId);
        heroesToken.safeTransferFrom(msg.sender, address(this), _tokenId);
    }

    /**
     * @dev withdraw the user's staked token
     * @param _tokenId id of hero token
     */
    function unstake(uint256 _tokenId) external {
        require(msg.sender == stakes[_tokenId].stakerAddress, "Sender is not staker");
        require(stakes[_tokenId].staked, "Unstaked already");
        _updateYield(_tokenId);
        stakes[_tokenId].staked = false;
        stakes[_tokenId].stakerAddress = address(0);

        // Since `delete` Solidity operator leaves zeroes at the deleted index and
        // doesn'd decrease array length.
        // To actually drop data and shorten the list, we copy last item to the index
        // of removed value (overwriting it) then pop last element to decrease array size
        for (uint256 i = 0; i < stakedTokens[msg.sender].length; ++i) {
            if (stakedTokens[msg.sender][i] == _tokenId) {
                uint256 lastElementIndex = stakedTokens[msg.sender].length - 1;
                stakedTokens[msg.sender][i] = stakedTokens[msg.sender][lastElementIndex];
                stakedTokens[msg.sender].pop();
                break;
            }
        }

        emit Unstake(msg.sender, _tokenId);
        heroesToken.safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    /**
     * @dev harvest accumulated rewards. Can be called many times.
     * @param _tokenId   Id of the token to be harvest
     */
    function harvest(uint256 _tokenId) external {
        _updateYield(_tokenId);
        uint256 amount = stakes[_tokenId].totalYield - stakes[_tokenId].harvestedYield;
        require(amount != 0, "harvestableYield is zero");
        stakes[_tokenId].harvestedYield = stakes[_tokenId].totalYield;

        emit Harvest(msg.sender, _tokenId, amount);
        nftlToken.transfer(msg.sender, amount);
    }

    function getStakedTokens(address _staker) public view returns (uint256[] memory) {
        return stakedTokens[_staker];
    }

    /**
     * @dev get the individual stake parameters of the user's staked token
     * @param _tokenId token stake index
     * @return staked the status of stake
     * @return stakerAddress address of staker
     * @return lastUpdateTime time of start staking
     * @return totalYield entire yield for the stake
     * @return harvestedYield The part of yield user harvested already
     */
    function getStake(uint256 _tokenId)
        external
        view
        returns (
            bool staked,
            address stakerAddress,
            uint256 lastUpdateTime,
            uint256 totalYield,
            uint256 harvestedYield
        )
    {
        StakeInfo memory _stake = stakes[_tokenId];
        staked = _stake.staked;
        stakerAddress = _stake.stakerAddress;
        lastUpdateTime = _stake.lastUpdateTime;
        totalYield = _stake.totalYield;
        harvestedYield = _stake.harvestedYield;
    }

    function getTokenRewardPerSecond(uint256 _tokenId) public view returns (uint256 rewardPerSecond) {
        rewardPerSecond = baseRewardPerSecond * heroesToken.getRarity(_tokenId);
    }

    // If token is staked, calculate its yield and update its stake parameters (totalYield and time)
    function _updateYield(uint256 _tokenId) internal {
        if (stakes[_tokenId].staked) {
            uint256 currentTime = block.timestamp;
            uint256 secondsStaked = currentTime - stakes[_tokenId].lastUpdateTime;
            uint256 rewardSinceLastUpdate = getTokenRewardPerSecond(_tokenId) * secondsStaked;
            stakes[_tokenId].totalYield += rewardSinceLastUpdate;
            stakes[_tokenId].lastUpdateTime = currentTime;
        }
    }
}
