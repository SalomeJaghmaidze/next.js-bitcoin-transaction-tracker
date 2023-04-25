import React, { useState, useEffect } from "react";
import Head from "next/head";
import Modal from "../components/modals/Modal";

interface Notification {
  message: string;
  id: number;
}

interface Transaction {
  message: string;
  id: number;
}

const Home: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  const playSound = () => {
    const audio = new Audio(
      "https://localhost.sharedwithexpose.com/notification.mp3"
    );
    console.log(process.env.PUBLIC_URL);
    audio.play();
  };

  const unsubscribeFromNewTransactions = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "unconfirmed_unsub" }));
    }
  };

  useEffect(() => {
    const websocket = new WebSocket("wss://ws.blockchain.info/inv");

    websocket.onopen = () => {
      console.log("Connected to WebSocket server.");
    };

    websocket.onmessage = (event) => {
      const transactionData = JSON.parse(event.data);
      if (transactionData.op === "utx") {
        const txHash = transactionData.x.hash;
        setNotifications([
          { message: `New transaction: ${txHash}`, id: Date.now() },
        ]);
        setTransactions((prevTransactions) => {
          const newTransaction = {
            message: `New transaction: ${txHash}`,
            id: Date.now(),
          };
          const updatedTransactions = [
            newTransaction,
            ...prevTransactions,
          ].slice(0, 20);
          return updatedTransactions;
        });
      }
    };

    websocket.onerror = (error) => {
      console.log("WebSocket error: ", error);
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server.");
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const subscribeToNewTransactions = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: "unconfirmed_sub" }));
    }
  };
  const fetchTransactionDetails = async (txHash: string) => {
    try {
      const response = await fetch(
        `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`
      );
      const data = await response.json();
      setTransactionDetails(data);
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch transaction details:", error);
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    fetchTransactionDetails(transaction.message.split(" ")[2]);
  };

  const closeModal = () => {
    setSelectedTransaction(null);
    setTransactionDetails(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 via-blue-100 to-gray-100">
      <Head>
        <title className="text-center">WebSocket Blockchain Transactions</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="px-6 py-12 mx-auto max-w-7xl">
        <div className="p-8 bg-white rounded-xl shadow-md">
          <h1 className="text-3xl text-center font-bold">
            WebSocket Blockchain Transactions
          </h1>
          <div className="mt-6 flex-row text-center space-x-7">
            <button
              onClick={subscribeToNewTransactions}
              className="px-4 py-2 text-white bg-blue-600 rounded-md"
            >
              Subscribe to blockchain live transaction
            </button>
            <button
              onClick={unsubscribeFromNewTransactions}
              className="px-4 py-2 text-white bg-red-600 rounded-md"
            >
              Unsubscribe
            </button>
          </div>

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className=" p-3 mt-4 bg-green-100 rounded-md"
            >
              {notification.message}
            </div>
          ))}
          <div className="mt-8 space-y-4">
            {transactions.map((transaction, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-md shadow-md cursor-pointer"
                onClick={() => handleTransactionClick(transaction)}
              >
                {transaction.message}
              </div>
            ))}
          </div>

          <Modal show={!!selectedTransaction} onClose={closeModal}>
            <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>
            {transactionDetails ? (
              <div>
                {/* Display transaction details here */}
                <p>Transaction Hash: {transactionDetails.hash}</p>
                <p>
                  Transaction amount in BTC:{" "}
                  {transactionDetails.total * 0.00000001}
                </p>
                {/* <p>Transaction input: {transactionDetails.inputs}</p> */}
              </div>
            ) : (
              <p>Loading transaction details...</p>
            )}
          </Modal>
        </div>
      </main>
    </div>
  );
};

export default Home;
