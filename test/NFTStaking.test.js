const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('NFTStaking', function() {
  before(async function() {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.account1 = this.signers[1];

    this.contract = await ethers.getContractFactory('NFTStaking');
    this.nftlTokenFactory = await ethers.getContractFactory('ERC20Mock');
    this.heroesTokenFactory = await ethers.getContractFactory('CollectionMock');
  });

  beforeEach(async function() {
    this.nftlToken = await this.nftlTokenFactory.deploy('NFTL', 'NFTL', this.owner.address);
    this.heroesToken = await this.heroesTokenFactory.deploy();
    this.pool = await this.contract.deploy(this.nftlToken.address, this.heroesToken.address);
  });

  it('should be deployed', async function() {
    expect(await this.nftlToken.deployed(), true);
    expect(await this.heroesToken.deployed(), true);
    expect(await this.pool.deployed(), true);
  });

  it('initial states', async function() {
    expect(await this.pool.owner()).to.equal(this.owner.address);
    expect(await this.pool.stakesOpen()).to.equal(false);
    expect(await this.pool.getStakedTokens(this.owner.address)).to.deep.equal([]);
    expect(await this.nftlToken.balanceOf(this.owner.address)).to.equal('0');
    expect(await this.heroesToken.balanceOf(this.owner.address)).to.equal('0');
  });

  it('should revert when Stakes are not started yet', async function() {
    await expect(this.pool.stop()).to.be.revertedWith('Stakes are stopped already');
  });
});
