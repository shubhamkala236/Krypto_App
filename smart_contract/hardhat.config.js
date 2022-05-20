require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/cu9MFsuT-QDodhWFISDSFgeOrOc3VRUo',
      accounts: ['d4d24729c66ab11584c50331f041e34bb60e8d0adba2f04a5a6a0f1ea17cb0e8'],
    },
  },
};