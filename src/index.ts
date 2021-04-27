import { prompt } from 'inquirer';
import * as figlet from 'figlet';
const clear = require('clear');
import ShamirPrompter from "./Shamir/ShamirPrompter";
import MignottePrompter from "./Mignotte/MignottePrompter";

export async function mainMenu() {
    const answer = await prompt({
        name: 'action',
        message: 'Choose a method of sharing a secret',
        type: 'list',
        choices: [
            {name: '1) Shamir Secret Sharing', value: () => new ShamirPrompter().promptMainMenu()},
            {name: '2) Mignotte Secret Sharing', value: () => new MignottePrompter().promptMainMenu()},
            {name: 'Exit', value: () => process.exit(0)},
        ],
    });
    await answer.action()
}

(async () => {
    clear();
    console.log(figlet.textSync('Secret Sharing', {
        font: 'Standard',
        horizontalLayout: 'fitted',
        verticalLayout: 'default',
        width: 100,
    }));
    while (true) await mainMenu();
})();
