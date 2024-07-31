import { it, expect, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should able to create a new transaction', async () => {

    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit'
    })

    expect(response.statusCode).toEqual(201)
  })

  it('should albe to list all transactions', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit'
    })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    const ListTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(ListTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000
      }),
    ])
  })

  it('should albe to to get a specific transactions', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit'
    })

    const cookies = createTransactionResponse.get('Set-Cookie') ?? []

    const ListTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = ListTransactionResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000
      }),
    )
  })
})

it('should albe to get the summary', async () => {
  const createTransactionResponse = await request(app.server).post('/transactions').send({
    title: 'New transaction',
    amount: 5000,
    type: 'credit'
  })

  const cookies = createTransactionResponse.get('Set-Cookie') ?? []

  await request(app.server).post('/transactions')
    .set('Cookie', cookies)
    .send({
      title: 'Debit transaction',
      amount: 2000,
      type: 'debit'
    })

  const SummaryResponse = await request(app.server)
    .get('/transactions/summary')
    .set('Cookie', cookies)
    .expect(200)



  expect(SummaryResponse.body.summary).toEqual({
    amount: 3000,
  })
})



