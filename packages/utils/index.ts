import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from 'const'
import { Address, Bytes, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { NULL_CALL_RESULT_VALUE } from 'const'
import { ERC20 } from 'multitokenstaking/generated/MultiTokenStaking/ERC20'
import { ERC20NameBytes } from 'multitokenstaking/generated/MultiTokenStaking/ERC20NameBytes'
import { ERC20SymbolBytes } from 'multitokenstaking/generated/MultiTokenStaking/ERC20SymbolBytes'

export function hexToDecimal(hexString: string, decimals: number): BigDecimal {
  let bytes = Bytes.fromHexString(hexString).reverse() as Bytes;
  let bi = BigInt.fromUnsignedBytes(bytes);
  let scale = BigInt.fromI32(10).pow(decimals as u8).toBigDecimal();
  return bi.divDecimal(scale)
}

export function joinHyphen(vals: string[]): string {
  let ret = vals[0];
  for (let i = 1; i < vals.length; i++) {
    ret = ret.concat('-').concat(vals[i]);
  }
  return ret;
}

export function convertTokenToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals == BIG_INT_ZERO) {
    return amount.toBigDecimal()
  }
  let scale = BigInt.fromI32(10).pow(decimals.toI32() as u8).toBigDecimal()
  return amount.toBigDecimal().div(scale)
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return convertTokenToDecimal(eth, BigInt.fromI32(18))
}

export function equalToZero(value: BigDecimal): boolean {
  return value.equals(BIG_DECIMAL_ZERO)
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001' || value == ''
}

export function pow(base: BigDecimal, exponent: number): BigDecimal {
  let result = base

  if (exponent == 0) {
    return BigDecimal.fromString('1')
  }

  for (let i = 2; i <= exponent; i++) {
    result = result.times(base)
  }

  return result
}

export function getDecimals(address: Address): BigInt {
  let  contract = ERC20.bind(address)

  let decimalValue = null

  let decimalResult = contract.try_decimals()

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  } else {
    decimalValue = 18
  }

  return BigInt.fromI32(decimalValue as i32)
}

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
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
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

