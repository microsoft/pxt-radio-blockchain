# radio-blockchain

A toy blockchain over radio

## ~ hint

This is blockchain implementation is for educational purposes only.

## ~

## Usage

The library starts as soon as the @boardname@ starts.
It uses the radio.

### Add a block #radioblockchainaddblock

The ```addBlock``` adds a block in the blockchain and broadcast its to peers.

```sig
blockchain.addBlock(0)
```

### Read the values #radioblockchainvalues

Use the ``values`` block to get an array of number
of the values stored in the chain, minus the genesis block.

```sig
blockchain.values()
```

### Filtering values by @boardname@ #radioblockvaluesfrom

You can also get the values contributed by a particular
@boardname@ using ``valuesFrom``. The ``id`` block gives your @boardname@ id.

```sig
blockchain.valuesFrom(blockchain.id())
```

## Events #radioblockchainonevent

Events are raised when the chain is updated (when you received a new chain) or broadcasted.

```sig
blockchain.onEvent(BlockChainEvent.Update, () => {})
```

## License

MIT

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)

```package
github:Microsoft/pxt-radio-blockchain
```

## References

* https://medium.com/@lhartikk/a-blockchain-in-200-lines-of-code-963cc1cc0e54
* https://medium.com/crypto-currently/lets-build-the-tiniest-blockchain-e70965a248b
* https://medium.com/@micheledaliessi/how-does-the-blockchain-work-98c8cd01d2ae
