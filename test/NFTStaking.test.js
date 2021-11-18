const { ethers } = require('hardhat');
const { expect } = require('chai');
const { BigNumber } = require('ethers');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('NFTStaking', function() {
  before(async function() {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.account1 = this.signers[1];
    this.stranger = this.signers[2];

    this.contract = await ethers.getContractFactory('NFTStaking');
    this.nftlTokenFactory = await ethers.getContractFactory('ERC20Mock');
    this.heroesTokenFactory = await ethers.getContractFactory('CollectionMock');
  });

  describe('Deploy', function() {
    beforeEach(async function() {
      this.nftlToken = await this.nftlTokenFactory.deploy('NFTL', 'NFTL', this.owner.address, 0);
      this.heroesToken = await this.heroesTokenFactory.deploy();
      this.pool = await this.contract.deploy(this.nftlToken.address, this.heroesToken.address);
    });

    it('should revert if the nftl token address is zero', async function() {
      await expect(this.contract.deploy(ZERO_ADDRESS, this.heroesToken.address)).to.be.revertedWith(
        'Empty NFTL token address',
      );
    });

    it('should revert if the heroes token address is zero', async function() {
      await expect(this.contract.deploy(this.nftlToken.address, ZERO_ADDRESS)).to.be.revertedWith(
        'Empty heroes address',
      );
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
      expect(await this.nftlToken.balanceOf(this.pool.address)).to.equal('0');
      expect(await this.heroesToken.balanceOf(this.pool.address)).to.equal('0');
    });

    it('should revert when Stakes are not started yet', async function() {
      await expect(this.pool.stop()).to.be.revertedWith('Stakes are stopped already');
    });

    it('should revert stake when Stakes are not started yet', async function() {
      await expect(this.pool.stake(0)).to.be.revertedWith('stake: not open');
    });

    it('Non-owner can\'t start staking', async function() {
      await expect(this.pool.connect(this.account1).start()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    describe('Start staking', async function() {
      beforeEach(async function() {
        await this.pool.start();
        await this.heroesToken.initialize();
        await this.heroesToken.addBatch(
          0,
          10,
          'https://ipfs.io/ipfs/QmSQENpQaQ9JLJRTXxDGR9zwKzyXxkYsk5KSB3YsGQu78a',
          10,
        );
        await this.heroesToken.mint(this.owner.address, 10);
      });

      it('should revert when start () is called again', async function() {
        await expect(this.pool.start()).to.be.revertedWith('Stakes are open already');
      });

      it('Stop() called by owner closes stakes', async function() {
        await this.pool.stop();
        expect(await this.pool.stakesOpen()).to.equal(false);
      });

      it('Non-owner can\'t stop staking', async function() {
        await expect(this.pool.connect(this.account1).stop()).to.be.revertedWith('Ownable: caller is not the owner');
      });

      describe('Owner added reward token on the contract', async function() {
        beforeEach(async function() {
          await this.nftlToken.mint(this.pool.address, BigNumber.from('3600000').mul(BigNumber.from(10).pow(18)));
        });

        it('Balance of NFTL tokens increased', async function() {
          expect(await this.nftlToken.balanceOf(this.pool.address)).to.equal(
            BigNumber.from('3600000').mul(BigNumber.from(10).pow(18)),
          );
        });

        it('should revert if not hero token allowance', async function() {
          await expect(this.pool.stake(10)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
        });

        describe('Owner staked', function() {
          beforeEach(async function() {
            await this.heroesToken.approve(this.pool.address, 10);
            this.stake1 = await this.pool.stake(10);
          });

          it('emits event Transfer on staking', async function() {
            await expect(this.stake1)
              .to.emit(this.heroesToken, 'Transfer')
              .withArgs(this.owner.address, this.pool.address, 10);
          });

          it('emits event Stake', async function() {
            await expect(this.stake1).to.emit(this.pool, 'Stake').withArgs(this.owner.address, 10);
          });

          it('check stake details', async function() {
            expect((await this.pool.getStake(10)).staked).to.equal(true);
            expect((await this.pool.getStake(10)).stakerAddress).to.equal(this.owner.address);
            expect((await this.pool.getStake(10)).totalYield).to.equal('0');
            expect((await this.pool.getStake(10)).harvestedYield).to.equal('0');
          });

          it('non-staker unable to unstake', async function() {
            await expect(this.pool.connect(this.stranger).unstake(10)).to.be.reverted;
            expect((await this.pool.getStake(10)).staked).to.equal(true);
            expect((await this.pool.getStake(10)).stakerAddress).to.equal(this.owner.address);
          });

          it('getStakedTokens length has proper staked ids', async function() {
            expect(await this.pool.getStakedTokens(this.stranger.address)).to.have.lengthOf(0);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(10);
            expect(await this.pool.getStakedTokens(this.owner.address)).to.have.lengthOf(1);
            await this.heroesToken.mint(this.owner.address, 0);
            await this.heroesToken.approve(this.pool.address, 0);
            await this.pool.stake(0);
            await this.heroesToken.mint(this.owner.address, 1);
            await this.heroesToken.approve(this.pool.address, 1);
            await this.pool.stake(1);
            await this.heroesToken.mint(this.owner.address, 2);
            await this.heroesToken.approve(this.pool.address, 2);
            await this.pool.stake(2);
            await this.heroesToken.mint(this.owner.address, 3);
            await this.heroesToken.approve(this.pool.address, 3);
            await this.pool.stake(3);
            expect(await this.pool.getStakedTokens(this.owner.address)).to.have.lengthOf(5);
            // owner's stakes order: [10, 0, 1, 2, 3]
            // unstaking decreases the length of staked tokens
            // and last element moved to removed index
            expect((await this.pool.getStakedTokens(this.owner.address))[2]).to.equal(1);
            await this.pool.unstake(1);
            // new order: [10, 0, 3, 2]
            expect(await this.pool.getStakedTokens(this.owner.address)).to.have.lengthOf(4);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(10);
            expect((await this.pool.getStakedTokens(this.owner.address))[1]).to.equal(0);
            expect((await this.pool.getStakedTokens(this.owner.address))[2]).to.equal(3); // was 1
            expect((await this.pool.getStakedTokens(this.owner.address))[3]).to.equal(2);
            // now deleting value 2 located by the last index in the array.
            // This works as usual and order doesn't change
            await this.pool.unstake(2);
            // now: [10, 0, 3]
            expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(3);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(10);
            expect((await this.pool.getStakedTokens(this.owner.address))[1]).to.equal(0);
            expect((await this.pool.getStakedTokens(this.owner.address))[2]).to.equal(3);
            await this.pool.unstake(0);
            // now: [10, 3]
            expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(2);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(10);
            expect((await this.pool.getStakedTokens(this.owner.address))[1]).to.equal(3);
            await this.pool.unstake(10);
            // now: [3]
            expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(1);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(3);
            await this.pool.unstake(3);
            // now: []
            expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(0);
            // staking is possible after all items were unstaked
            await this.heroesToken.approve(this.pool.address, 0);
            await this.pool.stake(0);
            await this.heroesToken.approve(this.pool.address, 1);
            await this.pool.stake(1);
            await this.heroesToken.approve(this.pool.address, 2);
            await this.pool.stake(2);
            expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(3);
            expect((await this.pool.getStakedTokens(this.owner.address))[0]).to.equal(0);
            expect((await this.pool.getStakedTokens(this.owner.address))[1]).to.equal(1);
            expect((await this.pool.getStakedTokens(this.owner.address))[2]).to.equal(2);
          });

          describe('Staker unstaked', function() {
            beforeEach(async function() {
              this.stake1 = await this.pool.unstake(10);
            });

            it('emits event Unstake', async function() {
              await expect(this.stake1).to.emit(this.pool, 'Unstake').withArgs(this.owner.address, 10);
            });

            it('getStaked tokens has zero length', async function() {
              expect((await this.pool.getStakedTokens(this.owner.address))).to.have.lengthOf(0);
            });

            it('staked flag and stakerAddress got cleared', async function() {
              expect((await this.pool.getStake(10)).staked).to.equal(false);
              expect((await this.pool.getStake(10)).stakerAddress).to.equal(ZERO_ADDRESS);
              expect((await this.pool.getStake(10)).totalYield).to.equal('0');
              expect((await this.pool.getStake(10)).harvestedYield).to.equal('0');
            });
          });
        });
      });
    });
  });
});
