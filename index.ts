import * as crypto from 'crypto';

const SHA256 = 'SHA256';
const MD5 = 'md5';
const HEX = 'hex';
const RSA = 'rsa';

class Transaction {
    constructor(
        public amount: number,
        public payer: string, // public key
        public payee: string, // public key
    ) {
    }

    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    public nonce = Math.round(Math.random() * 999999999);
    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public time = Date.now(),
    ) {
    }

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash(SHA256);
        hash.update(str).end();
        return hash.digest(HEX);
    }
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('⛏️ mining...');

        while(true) {
            const hash = crypto.createHash(MD5);
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest(HEX);

            if(attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify(SHA256);
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

class Wallet {
    public publicKey = "";
    public privateKey = "";

    constructor() {
        const keypair = crypto.generateKeyPairSync(
            RSA,
            {
                modulusLength: 2048,
                publicKeyEncoding: {type: 'spki', format: 'pem'},
                privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
            }
        );

        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign(SHA256);
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature)
    }

}


const satoshi = new Wallet();
const quentin = new Wallet();
const martin = new Wallet();

satoshi.sendMoney(100, quentin.publicKey);
quentin.sendMoney(88, martin.publicKey);
martin.sendMoney(12, satoshi.publicKey);

console.log(Chain.instance);