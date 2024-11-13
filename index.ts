import * as crypto from 'crypto';

class Transaction {
    constructor(
        public amount: number,
        public payer: string, // public key
        public payee: string, // public key
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}

class Block {
    public nounce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string | null,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'genesis', 'satoschi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nounce: number) {
        let solution = 1;
        
        console.log('mining ...');

        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nounce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);

                return solution;
            }

            solution += 1;
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: string) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nounce);
            this.chain.push(newBlock);
        }
    }


}

class Wallet {
    public publicKey: string;
    public secretKey: string; 

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLenght: '2048',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            secretKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.publicKey = keypair.publicKey;
        this.secretKey = keypair.privateKey
    }

    spendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createHash('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.secretKey)
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
