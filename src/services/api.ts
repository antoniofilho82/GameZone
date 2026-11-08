import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://www.cheapshark.com/api/1.0',
  timeout: 6000,
})
