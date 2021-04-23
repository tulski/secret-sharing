const crt = require('nodejs-chinese-remainder/chinese_remainder_bignum');
import {randomBytes} from 'crypto';
import { Shares } from "../domain";
import BigNum = require("bignum");
const bignum = require('bignum');

export default class Mignotte {
    private PRIMES :bigint[] = [bignum('635057963244817117'), bignum('850387946977755721'), bignum('956529639129297449'), bignum('1123841641802976919')]
    private rand: bigint = bignum('329191744197430547917479608607820738907969788693828749');

    public generateRandomKey(length: number) {
        return randomBytes(length).toString('hex');
    }

    public split(hexKey: string): Shares {
        let key = bignum(hexKey);
        key = key.add(this.rand);
        const shares: BigNum[] = [];
        for (let prime of this.PRIMES) {
            shares.push(bignum.mod(key, prime));
        }
        return shares.reduce((acc, val, index) => ({...acc, [index+1]: val.toString() }), {})
    }

    public combine(shares: Shares): string {
        const intShares = Object.values(shares).map(string => bignum(string));
        const reminders = [intShares[0], intShares[1], intShares[2]]
        const modules = [this.PRIMES[0], this.PRIMES[1], this.PRIMES[2]]
        const res = crt(reminders, modules);
        return res.sub(this.rand).toString();
    }

    public crt(reminders: bigint[], modules: bigint[]): bigint {
        let p = BigInt(1);
        let p1 = BigInt(1);
        let prod = BigInt(1);
        let sm = BigInt(0);
        for (let i = 0; i < modules.length; i++) {
            prod = prod * modules[i];
        }
        for (let i = 0; i < modules.length; i++) {
            p = prod / modules[i];
            sm += reminders[i] * this.mul_inv(p, modules[i] * p)
        }
        return sm % prod;
    }

    private mul_inv(a1: bigint, b1: bigint): bigint {
        let a = a1;
        let b = b1;
        let b0 = b;
        let x0 = BigInt(0);
        let x1 = BigInt(1);
        let q, tmp;
        if (b.toString() === '1') { return b }
        while (a > 1) {
            try {
                q = a / b;
            } catch (e) { }
            tmp = a;
            a = b;
            b = tmp % b;
            tmp = x0;
            x0 = x1 - (q * x0);
            x1 = tmp;
        }
        if (x1 < 0) {
            x1 += b0;
        }
        return x1;
    }
}
