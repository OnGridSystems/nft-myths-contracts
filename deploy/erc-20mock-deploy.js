module.exports = async function({ ethers, getNamedAccounts, deployments, hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const name = 'NFTL';
  const symbol = 'NFTL';
  const toAddress = deployer;
  const startBalance = ethers.utils.parseEther('100');

  await deploy('ERC20Mock', {
    from: deployer,
    log: true,
    args: [name, symbol, toAddress, startBalance],
    skipIfAlreadyDeployed: true,
  });
};

module.exports.tags = ['ERC20Mock'];
