import { prompt } from "inquirer";
import Mignotte  from './Mignotte'
import { Shares } from "../domain";

export default class MignottePrompter {
    private key?: string;
    private shares?: Shares;
    private mignotte: Mignotte = new Mignotte();

    public async promptMainMenu() {
        const answer = await prompt({
            name: 'action',
            message: 'Mignotte Secret Sharing',
            type: 'list',
            choices: [
                {name: '1) Generate a random key', value: () => this.generateRandomKey()},
                {name: '2) Split a key to shares', value: () => this.splitSecret()},
                {name: '3) Combine shares', value: () => this.combineShares()},
                {name: '4) Back', value: () => false},
                {name: 'Exit', value: () => process.exit(0)},
            ],
        });
        if (await answer.action() !== false) {
            await this.promptMainMenu();
        }
    }

    private async generateRandomKey() {
        const { length } = await prompt({
            name: 'length',
            message: 'Enter key length:',
            type: 'number',
            validate: input => !!input,
            default: 10,
        });
        this.key = this.mignotte.generateRandomKey(length);
        console.log(`Key: ${this.key}`);
    }

    private async splitSecret() {
        const { secret } = await prompt({
            name: 'secret',
            message: 'Secret to split:',
            type: 'input',
            validate: input => !!input,
            default: this.key,
        });
        this.key = secret;
        const { numOfShares } = await prompt({
            name: 'numOfShares',
            message: 'Enter number of shares to generate:',
            type: 'number',
            validate: input => input > 0,
            default: 4,
        });
        this.shares = this.mignotte.split(secret);
        console.log(this.shares);
    }

    private async combineShares() {
        const { numberOFShares } = await prompt({
            name: 'numberOFShares',
            message: 'Number of shares to combine:',
            type: 'number',
            validate: input => input > 0,
            default: this.shares ? Object.keys(this.shares).length : 0,
        });
        const sharesToCombine: Shares = {};
        for (let i = 1; i <= numberOFShares; i++) {
            let { shareSecret } = await prompt({
                name: 'shareSecret',
                message: `Enter ${i} share secret:`,
                type: 'input',
                default: this.shares ? this.shares[i] : '',
            });
            sharesToCombine[i] = shareSecret;
        }
        console.log(`Key: ${this.mignotte.combine(this.shares)}`);
    }
}
