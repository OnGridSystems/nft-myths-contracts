// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library Search {
    function indexOf(uint256[] storage self, uint256 value) public view returns (uint256) {
        for (uint256 i = 0; i < self.length; i++) if (self[i] == value) return i;
        return type(uint256).max;
    }
}

contract NFTStaking is Ownable {
    using Search for uint256[];
    using SafeMath for uint256;
    // user deposits are recorded in StakeInfo[] stakes struct
    struct StakeInfo {
        // staked is true if deposit is staked and hasn't been unstaked.
        // After user claims his stake back, `staked` becomes false
        bool staked;
        // totalYield is a total value of rewards for the given stake.
        // user is able to withdraw yield.
        uint256 totalYield;
        // The amount of yield user already harvested and the time of last harvest call.
        uint256 harvestedYield;
        // reward for staked token
        uint256 rewardPerSecond;
    }

    // If stakesOpen == true, the contract is operational and accepts new stakes.
    // Otherwise it allows just harvesting and unstaking.
    bool public stakesOpen;

    // Token used for rewards
    IERC20 public nftlToken;

    // The token accepted for staking
    IERC721 public heroesToken;

    // struccture that stores the records of users' stakes
    mapping(address => mapping(uint256 => StakeInfo[])) public stakes;
    // struccture that stores the records of users' staked tokens
    mapping(address => uint256[]) public stakedTokens;

    // Reward that staker will receive for his stake
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
        heroesToken = IERC721(_heroesAddress);
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
        // entire reward allocated for the user for this stake
        uint256 totalYield = baseRewardPerSecond;
        uint256 rewardPerSecond = baseRewardPerSecond;
        stakes[msg.sender][_tokenId].push(
            StakeInfo({staked: true, totalYield: totalYield, harvestedYield: 0, rewardPerSecond: rewardPerSecond})
        );
        stakedTokens[msg.sender].push(_tokenId);

        emit Stake(msg.sender, _tokenId);
        heroesToken.safeTransferFrom(msg.sender, address(this), _tokenId);
    }

    /**
     * @dev withdraw the user's staked token
     * @param _tokenId id of hero token
     */
    function unstake(uint256 _tokenId) external {
        (bool staked, , , ) = getStake(msg.sender, _tokenId);
        require(staked, "Unstaked already");
        stakes[msg.sender][_tokenId][_tokenId].staked = false;
        uint256 indexOfToken = stakedTokens[msg.sender].indexOf(_tokenId);
        delete stakedTokens[msg.sender][indexOfToken];

        emit Unstake(msg.sender, _tokenId);
        heroesToken.safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    /**
     * @dev harvest accumulated rewards. Can be called many times.
     * @param _tokenId   Id of the token to be harvest
     */
    function harvest(uint256 _tokenId) external {
        (, uint256 totalYield, uint256 harvestedYield, ) = getStake(msg.sender, _tokenId);
        uint256 amount = totalYield.sub(harvestedYield);
        require(amount != 0, "harvestableYield is zero");
        stakes[msg.sender][_tokenId][_tokenId].harvestedYield = harvestedYield.add(amount);

        emit Harvest(msg.sender, _tokenId, amount);
        nftlToken.transfer(msg.sender, amount);
    }

    function getStakedTokens(address _staker) public view returns (uint256[] memory) {
        return stakedTokens[_staker];
    }

    /**
     * @dev get the individual stake parameters of the user's staked token
     * @param _staker account of staker
     * @param _stakeId token stake index
     * @return staked the status of stake
     * @return totalYield entire yield for the stake
     * @return harvestedYield The part of yield user harvested already
     */
    function getStake(address _staker, uint256 _stakeId)
        public
        view
        returns (
            bool staked,
            uint256 totalYield,
            uint256 harvestedYield,
            uint256 rewardPerSecond
        )
    {
        StakeInfo memory _stake = stakes[_staker][_stakeId][_stakeId];
        staked = _stake.staked;
        totalYield = _stake.totalYield;
        harvestedYield = _stake.harvestedYield;
        rewardPerSecond = _stake.rewardPerSecond;
    }
}
