const { task } = require('hardhat/config');

task('4-reveal-zero-batch', 'reveal zero batch').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    0,
    3,
    'ipfs://QmZHmjtCmrT2ZnbQmxoDg6dtD63QG5kE8zRg9hJC79VjvG',
    100000,
  );
  console.log('batch is revealed');

  const collection = await ethers.getContract('Collection');
  console.log('tokenURI: ', await collection.tokenURI(0));
  console.log('tokenURI: ', await collection.tokenURI(1));
  console.log('tokenURI: ', await collection.tokenURI(2));
  console.log('tokenURI: ', await collection.tokenURI(3));
  console.log('tokenURI (default): ', await collection.tokenURI(4));
});
