import { Address, BigInt } from '@graphprotocol/graph-ts'
import { NULL_CALL_RESULT_VALUE } from 'const'

import { ERC20 } from '../generated/MultiTokenStaking/ERC20'
import { ERC20NameBytes } from '../generated/MultiTokenStaking/ERC20NameBytes'
import { ERC20SymbolBytes } from '../generated/MultiTokenStaking/ERC20SymbolBytes'

export function getSymbol(address: Address): string {
  // hard coded override
  if (address.toHex() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') {
    return 'DGD'
  }
  if (address.toHex() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return 'AAVE'
  }
  if (address.toHex() == '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c') {
    return 'yUSD'
  }

  let  contract = ERC20.bind(address)
  let  contractSymbolBytes = ERC20SymbolBytes.bind(address)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let  symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let  symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (symbolResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function getName(address: Address): string {
  let contract = ERC20.bind(address as Address)
  let contractNameBytes = ERC20NameBytes.bind(address as Address)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (nameResultBytes.value.toHex() != NULL_CALL_RESULT_VALUE) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function getDecimals(address: Address): BigInt {
  let  contract = ERC20.bind(address)

  // try types uint8 for decimals
  let decimalValue = null

  let decimalResult = contract.try_decimals()

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }

  return BigInt.fromI32(decimalValue as i32)
}