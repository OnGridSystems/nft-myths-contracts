module.exports = async function({ ethers, getNamedAccounts, deployments }) {
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const nftlToken = (await ethers.getContract('ERC20Mock')).address;
  const heroesToken = (await ethers.getContract('Collection')).address;

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

  const staking = await deployments.get('NFTStaking');

  await execute('ERC20Mock', { from: deployer, log: true }, 'transfer', staking.address, ethers.utils.parseEther('50'));
};

module.exports.dependencies = ['Collection', 'ERC20Mock'];
