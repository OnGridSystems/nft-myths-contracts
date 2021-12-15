module.exports = async function({ ethers, getNamedAccounts, deployments }) {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const nftlToken = (await ethers.getContract('NFTL')).address;
  const heroesToken = (await ethers.getContract('Collection')).address;
  const baseRewardPerSecond = 115740740741;

  await deploy('NFTStaking', {
    from: deployer,
    log: true,
    args: [nftlToken, heroesToken],
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      methodName: 'initialize',
    },
    skipIfAlreadyDeployed: true,
  });

  const staking = await ethers.getContract('NFTStaking');

  if (await staking.stakesOpen()) {
    console.log('Stakes are open. No need to start it again.');
  } else {
    console.log('Stakes are not open. Starting');
    await execute('NFTStaking', { from: deployer, log: true }, 'start');
  }

  const currentBaseRewardPerSecond = (await staking.baseRewardPerSecond()).toNumber();
  console.log('Current BaseRewardPerSecond is', currentBaseRewardPerSecond.toString());

  if (currentBaseRewardPerSecond !== baseRewardPerSecond) {
    await execute('NFTStaking', { from: deployer, log: true }, 'setBaseRewardPerSecond', baseRewardPerSecond);
  }

  const nftlTokenAddress = await staking.nftlToken();
  console.log('Current NFTL token address is', nftlTokenAddress);
  if (nftlTokenAddress !== nftlToken) {
    await execute('NFTStaking', { from: deployer, log: true }, 'setNftl', nftlToken);
  }
};

module.exports.dependencies = ['NFTL'];
module.exports.tags = ['Staking'];
