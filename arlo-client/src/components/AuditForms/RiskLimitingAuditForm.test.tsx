import React from 'react'
import { render, act } from '@testing-library/react'
import AuditForms from './RiskLimitingAuditForm'
import apiMock from '../utilities'

jest.mock('../utilities')

it('renders correctly', () => {
  let utils: any
  act(() => {
    utils = render(<AuditForms />)
  })
  const { container } = utils
  expect(container).toMatchSnapshot()
})

it('fetches from api as expected', () => {
  act(() => {
    render(<AuditForms />)
  })
  expect(apiMock).toBeCalled()
  expect((apiMock as jest.Mock).mock.calls[0][0]).toBe('/audit/status')
})
