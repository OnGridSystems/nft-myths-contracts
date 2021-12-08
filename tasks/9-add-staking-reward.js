const { task } = require('hardhat/config');

task('9-add-staking-reward', 'set base reward per second').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  const price = 115740740741;

  try {
    await execute('NFTStaking', { from: deployerAddress, log: true }, 'setBaseRewardPerSecond', price);
    console.log(`BaseRewardPerSecond is set at ${price}`);
  } catch (e) {
    console.log(e);
  }
});
