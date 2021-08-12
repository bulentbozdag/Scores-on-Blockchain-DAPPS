import Web3 from 'web3';
import * as ScoresJSON from '../../../build/contracts/Scores.json';
import { Scores } from '../../types/ScoresWrapper';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};


export class ScoresWrapper {
    web3: Web3;

    contract: Scores;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(ScoresJSON.abi as any) as any;
    }

    

    get isDeployed() {
        return Boolean(this.address);
    }

    async createNFT(imgUrl: string, country: string, win: string, lost: string, fromAddress: string) {
        const _str = imgUrl+'@'+country+'@'+win+'@'+lost;
        const tx = await this.contract.methods.awardItem(fromAddress, _str).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async getBalanceOf(fromAddress: string) {
        const data = await this.contract.methods.balanceOf(fromAddress).call({ from: fromAddress });
        return data;
    }

    async getList(address: string) {
        const totalNft = await this.getBalanceOf(address);
        console.log(totalNft);
        const arrNFT = new Array(Number(totalNft)).fill(0).map((_, index) => index + 1);
        const data = await Promise.all(
            arrNFT.map(_nftId =>
                this.contract.methods.tokenURI(_nftId.toString()).call({
                    from: address
                })
            )
        );
        return data;
    }

    async deploy(fromAddress: string) {
        const contract = await (this.contract
            .deploy({
                data: ScoresJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(contract.contractAddress);
        return contract.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
