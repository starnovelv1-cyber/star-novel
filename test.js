import http from 'k6/http'
import { sleep, check } from 'k6'

export const options = {
  vus: 1000,
  duration: '1m',
}

export default function () {
  const res = http.get('https://star-novel.vercel.app')
  check(res, { 'status 200': (r) => r.status === 200 })
  sleep(1)
}
