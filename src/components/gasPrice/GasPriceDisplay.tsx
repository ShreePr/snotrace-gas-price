import React, { useState, useEffect, FC } from 'react';
import axios from 'axios';
import { GasDataProps } from './gas-price-interface';

const GasPriceDisplay: FC = () => {
  const [gasPrices, setGasPrices] = useState<GasDataProps[]>([]);
  const sortByExpectedCloseDate = (a: any, b: any) =>
    new Date(a.timestamp).getDate() - new Date(b.timestamp).getDate();
  const fetchGasPrices = async () => {
    try {
      await axios.get('http://localhost:3000/gasDetails').then((res) => {
        setGasPrices(res?.data);
      });
    } catch (error) {
      console.error('Error fetching gas prices:', error);
    }
  };

  useEffect(() => {
    fetchGasPrices();
  }, []);

  return (
    <div>
      <div className='gas-table'>
        <h1>Gas Prices</h1>
      </div>

      <table className='table-body'>
        <thead>
          <tr>
            <th>Price</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {gasPrices?.sort(sortByExpectedCloseDate)?.map((gasPrice, index) => (
            <tr key={index}>
              <td>${gasPrice.price}</td>
              <td>{new Date(gasPrice.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GasPriceDisplay;
