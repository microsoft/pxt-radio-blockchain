# radio-blockchain

A toy blockchain over radio

## ~ hint

This is blockchain implementation is for educational purposes only.

## ~

## Usage

The library starts as soon as the @boardname@ starts.
It uses the radio.

### Add a block

The ```addBlock``` adds a block in the blockchain and broadcast its to peers.

```sig
blockchain.addBlock(0)
```

### Read the values

Use the ``values`` block to get an array of number
of the values stored in the chain, minus the genesis block.

```sig
blockchain.values()
```

You can also get the values contributed by a particular
@boardname@ using ``valuesFrom``. The ``id`` block gives your @boardname@ id.

```sig
blockchain.valuesFrom(blockchain.id())
```

## Events

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