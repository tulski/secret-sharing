import * as crt from 'nodejs-chinese-remainder/chinese_remainder_bignum';
import * as BigNum from "bignum";
import { Shares } from "../domain";

export default class Mignotte {
    private rand = new BigNum('329191744197430547917479608607820738907969788693828749');
    private PRIMES = [
        new BigNum('635057963244817117'),
        new BigNum('850387946977755721'),
        new BigNum('956529639129297449'),
        new BigNum('1123841641802976919')
    ];

    public split(hexKey: string): Shares {
        new BigNum(1)
        let key = new BigNum(hexKey);
        key = key.add(this.rand);
        const shares: BigNum[] = [];
        for (let prime of this.PRIMES) {
            shares.push(BigNum.mod(key, prime));
        }
        return shares.reduce((acc, val, index) => ({...acc, [index+1]: val.toString() }), {})
    }

    public combine(shares: Shares): string {
        const intShares = Object.values(shares).map(string => new BigNum(string));
        const reminders = [intShares[0], intShares[1], intShares[2]]
        const modules = [this.PRIMES[0], this.PRIMES[1], this.PRIMES[2]]
        const res = crt(reminders, modules);
        return res.sub(this.rand).toString();
    }
}
