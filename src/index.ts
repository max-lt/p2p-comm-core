import { Pool } from './core/pool';

const seed = process.argv.slice(2).map(e => parseInt(e));

console.log({ seed });

const pool = new Pool({ seed });

pool.listen(parseInt(process.env.PORT) || undefined);

pool.on('message', (m) => {
  process.stdout.write('> ' + m);
});

process.stdin.resume();
process.stdin.on('data', function (data) {
  pool.sendMessage(data.toString());
});
