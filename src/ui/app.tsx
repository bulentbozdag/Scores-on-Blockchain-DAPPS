/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from '../config';
import { ScoresWrapper } from '../lib/contracts/ScoresWrapper';
import { AddressTranslator } from 'nervos-godwoken-integration';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {

        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<ScoresWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [balance, setBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [imgUrl, setImgUrl] = useState('');
    const [country, setCountry] = useState('');
    const [win, setWin] = useState('');
    const [lost, setLost] = useState('');




    const [listDATA, setlistDATA] = useState([]);
    const [layer2Address, setLayer2Address] = useState<string | undefined>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function getLater2Address(account: string, web3: Web3) {
        const addressTranslator = new AddressTranslator();
        const depositAddress = await addressTranslator.getLayer2DepositAddress(web3, account);
        console.log(depositAddress.addressString)
        return depositAddress.addressString
    }

    const CompiledContractArtifact = require(`../abi/ERC20.json`);
    const SUDT_PROXY_CONTRACT_ADDRESS = "0x70E9C8cd289d78B874e5F4b8FfD95df37B3203Cb";

    async function getSUDTBalance(account: string, web3: Web3, polyjuiceAddress:string) {
        console.log(polyjuiceAddress);
        const contract = new web3.eth.Contract(CompiledContractArtifact.abi, SUDT_PROXY_CONTRACT_ADDRESS);
        const balance = await contract.methods.balanceOf(polyjuiceAddress).call({
            from: account
        })
        console.log(balance);

        return balance
    }

    useEffect(() => {
        if (contract) {
            setInterval(() => {
                console.log('getting list..')
                contract.getList(account).then(setlistDATA);
            }, 10000);
        }
    }, [contract]);

    async function deployContract() {
        const _contract = new ScoresWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);


            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new ScoresWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function createNFT() {
        try {
            setTransactionInProgress(true);
            // await contract.setStoredValue(newStoredNumberInputValue, account);
            await contract.createNFT(imgUrl, country, win, lost, account);
            toast('Successfully saved!', { type: 'success' });
        } catch (error) {
            console.error(error);
            toast.error('Failed :(');
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setBalance(_balance);
                const l2Address = await getLater2Address(_accounts[0], _web3);
                setLayer2Address(l2Address);
                const addressTranslator = new AddressTranslator();
                const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(_accounts[0]);
                const balance = await getSUDTBalance(_accounts[0], _web3, polyjuiceAddress);
                setSudtBalance(balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>

            <div className="divTop">



                <button className="btn-blue" onClick={deployContract} disabled={!balance}>
                    Deploy contract
                </button>
                &nbsp;or&nbsp;
                <input className="inputs"
                    placeholder="Existing contract id"
                    onChange={e => setExistingContractIdInputValue(e.target.value)}
                />
                <button
                    className="btn-blue"
                    disabled={!existingContractIdInputValue || !balance}
                    onClick={() => setExistingContractAddress(existingContractIdInputValue)}
                >
                    Use existing contract
                </button>
                <br />
                <br />
                {/* <button onClick={getStoredValue} disabled={!contract}>
                Get stored value
            </button> */}
                {storedValue ? <>&nbsp;&nbsp;Stored value: {storedValue.toString()}</> : null}
                <br />
                <br />
                <br />

                <div className="fl">
                    <table>
                        <tbody>
                            <tr>
                                <td> Your ETH address:</td>
                                <td> <b>{accounts?.[0]}</b></td>
                            </tr>
                            <tr>
                                <td> Your Polyjuice address:</td>
                                <td>  <b>{polyjuiceAddress || ' - '}</b></td>
                            </tr>
                            <tr>
                                <td> Nervos Layer 2 balance:</td>
                                <td> <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b></td>
                            </tr>
                            <tr>
                                <td> Deployed contract address:</td>
                                <td>  <b>{contract?.address || '-'}</b></td>
                            </tr>
                            <tr>
                                <td> Deploy transaction hash:</td>
                                <td> <b>{deployTxHash || '-'}</b></td>
                            </tr>
                            <tr>
                                <td>  Your Layer 2 Deposit Address on Layer 1:</td>
                                <td> <div className="textOverflow">{layer2Address}</div></td>
                            </tr>
                             <tr>
                                <td> Your SUDT balance:</td>
                                <td> <b>{sudtBalance}</b></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="fl">
                    <table>
                        <tbody>
                            <tr>
                                <td> <b>Flag: </b></td>
                                <td>  <input className="inputs"
                                    type="string"
                                    placeholder="flag image url"
                                    onChange={e => setImgUrl(e.target.value)}
                                /></td>
                            </tr>
                            <tr>
                                <td><b> Country:</b> </td>
                                <td>  <input className="inputs"
                                    type="string"
                                    onChange={e => setCountry(e.target.value)}
                                /></td>
                            </tr>
                            <tr>
                                <td><b>Win:</b> </td>
                                <td>  <input className="inputs"
                                    type="string"
                                    onChange={e => setWin(e.target.value)}
                                /></td>
                            </tr>
                            <tr>
                                <td> <b>Lost:</b> </td>
                                <td>  <input className="inputs"
                                    type="string"
                                    onChange={e => setLost(e.target.value)}
                                /></td>
                            </tr>
                            <tr>
                                <td>
                                    <button className="btn-blue" onClick={createNFT} disabled={!contract}>
                                        S A V E
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="clr"></div>


            </div>

             <div className="bg1">
                    Use the <a href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos" className="color-blue">Force bridge website</a> to transfer tokens from Ethereum to Nervos layer 2.<br />
           Select the Ethereum asset and amount to transfer across the bridge. In the box marked "Recipient", you will specify the Nervos destination address for the funds: input your the Layer 2 Deposit Address on Layer 1 mentioned above.<br />        
                    </div>
            
            {/*
    Italy  https://iapp.fanatik.com.tr/resize/40x40/Logos/broadage/teams/Soccer/606.png
    Holland https://iapp.fanatik.com.tr/resize/40x40/Logos/broadage/teams/Soccer/2815.png
    Germany https://iapp.fanatik.com.tr/resize/40x40/Logos/broadage/teams/Soccer/692.png
    France https://iapp.fanatik.com.tr/resize/40x40/Logos/broadage/teams/Soccer/1057.png 
*/}

            <div className="ptable">
                <h1 className="headin">EURO 2021</h1>
                <table>
                    <thead>
                        <tr className="col">
                            <th>#</th>
                            <th>Country</th>
                            <th>Win</th>
                            <th>Lost</th>
                        </tr>
                    </thead><tbody>
                        {listDATA.map(_str => (<tr className="pos">
                            <td><img key={_str.split('@')[0]} src={_str.split('@')[0]} /></td>
                            <td>{_str.split('@')[1]}</td>
                            <td>{_str.split('@')[2]}</td>
                            <td>{_str.split('@')[3]}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <hr />
            <ToastContainer />
        </div>
    );
}
