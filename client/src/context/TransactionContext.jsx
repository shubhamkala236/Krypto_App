import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";
import { parse } from "@ethersproject/transactions";

export const TransactionContext = React.createContext();

//meta mask object we get window.ethereum
const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  //fetch contract
  const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

  return transactionsContract;
  // console.log({
  //   provider,
  //   signer,
  //   transactionContract,
  // });
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };


  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = getEthereumContract();

        const availableTransactions = await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / (10 ** 18)
        }));

        console.log(structuredTransactions);

        setTransactions(structuredTransactions);

      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  //check if connected
  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please Install Metamask");
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };

  //for storing count of transactions
  const checkIfTransactionsExists = async () =>{
    try {
      const transactionsContract  = getEthereumContract();
      const transactionCount = await transactionsContract .getTransactionCount();
      window.localStorage.setItem("transactionCount",transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  }

  //Connect to wallet
  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please Install Metamask");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please Install Metamask");

      const { addressTo, amount, keyword, message } = formData;
      const transactionsContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      //sending ethereum transaction to blockachain (sending)
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: '0x5208', // always in hexadecimal 0x5208 = 21000 Gwei,
          value: parsedAmount._hex,  //0.0001 decimal value in amount ---> convert to gwei or hex decimal using parse ether 
        }],
      });

      // now storing above transaction in the blockchain (addToBlockchain)
      const transactionHash = await transactionsContract.addToBlockchain(addressTo,parsedAmount,message,keyword);
      
      //loading while transaction is made
      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);

      const transactionCount = await transactionsContract.getTransactionCount();

      setTransactionCount(transactionCount.toNumber());

    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExists();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        isLoading,
        currentAccount,
        formData,
        transactions,
        setFormData,
        handleChange,
        sendTransaction,
        transactionCount,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
