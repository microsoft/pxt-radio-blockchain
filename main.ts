enum BlockChainEvent {
    //% block="updated"
    Updated = 1,
    //% block="broadcasted"
    Broadcasted = 2,
}

/**
 * A toy blockchain implementation on top of the radio
 * 
 */
//% icon="\uf24d" color="#cc0099" weight=90
namespace blockchain {
    const BLOCKCHAIN_EVENT = 14000;

    enum Message {
        // ask peer to get the full chain
        QueryChain = 1,
        // a block flying around
        Block = 2
    }

    /**
     * A block is an immutable (can't change it) piece of a block chain.
     * The block chain is like a list where each block is built from
     * the previous block.
     */
    class Block {
        // index in the chain
        index: number;
        // serial number of device that added this block
        serialNumber: number;
        // in this implementation, data is the device serial number
        data: number;
        // hash of the previous block as a single unsigned byte
        previousHash: number; // uint8
        // hash of the current block as a single unsigned byte
        hash: number; // uint8

        /**
         * Construct the block and computes the hash
         */
        constructor(
            index: number,
            serialNumber: number,
            data: number,
            previousHash: number) {
            this.index = index;
            this.serialNumber = serialNumber;
            this.data = data;
            this.previousHash = previousHash;
            this.hash = this.computeHash();
        }

        /**
         * Compute the hash of the current block
         */
        computeHash() {
            let s = "" + this.index + this.serialNumber + this.data + this.previousHash;
            /**
             * dbj2 hashing, http://www.cse.yorku.ca/~oz/hash.html
             */
            let hash = 5381;
            for (let i = 0; i < s.length; i++) {
                let c = s.charCodeAt(i);
                hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
            }
            return hash;
        }

        /**
         * Create the next block with the given data
         */
        next(data: number) {
            return new Block(this.index + 1, control.deviceSerialNumber(), data, this.hash);
        }

        /**
         * Render the block as a string
         */
        toString() {
            return `block ${this.index} ${this.serialNumber} ${this.data} ${this.hash}`;
        }

        /**
         * Send the block over radio
         */
        broadcast() {
            serial.writeLine(`broadcast ${this}`);
            /**
            * We pack all the block data into a buffer and send it over radio
            */
            const buf = pins.createBuffer(16);
            buf.setNumber(NumberFormat.UInt8LE, 0, Message.Block);
            buf.setNumber(NumberFormat.UInt8LE, 1, this.hash);
            buf.setNumber(NumberFormat.UInt8LE, 2, this.previousHash);
            buf.setNumber(NumberFormat.Int32LE, 4, this.index);
            buf.setNumber(NumberFormat.Int32LE, 4 + 4, this.serialNumber);
            buf.setNumber(NumberFormat.Int32LE, 4 + 8, this.data);
            radio.sendBuffer(buf)
        }

        /**
         * Try to read the block from the buffer. If anything is wrong, return undefined.
         */
        static receive(buf: Buffer): Block {
            // check the message type
            if (buf.getNumber(NumberFormat.UInt8LE, 0) != Message.Block)
                return undefined;
            // read all the parts of the block back from the buffer
            const b = new Block(
                buf.getNumber(NumberFormat.Int32LE, 4), // index
                buf.getNumber(NumberFormat.Int32LE, 4 + 4), // serialNumber
                buf.getNumber(NumberFormat.Int32LE, 4 + 8), // data
                buf.getNumber(NumberFormat.UInt8LE, 2) // previoushash
            );
            const h = buf.getNumber(NumberFormat.UInt8LE, 1); // hash
            if (b.hash != h) {
                serial.writeLine(`received invalid block ${b.hash} != ${h}`);
                return undefined;
            }
            serial.writeLine(`received ${b}`);
            return b;
        }
    }

    /**
     * A block chain is a sequence of block
     */
    class BlockChain {
        id: number; // device serial number
        chain: Block[];

        /**
         * Constructs a new coin with the given id
         */
        constructor(id: number) {
            this.id = id;
            this.chain = [];
            // if ID is set, this coin is a mirror of a peer coin
            // otherwise add genesis block
            if (!this.id) {
                this.chain.push(new Block(0, 0, 0, 0));
                this.id = control.deviceSerialNumber();
            }
        }

        /**
         * Grab the last block in the chain
         */
        lastBlock() {
            return this.chain[this.chain.length - 1];
        }

        /**
         * Add a new block with your coin in the chain
         */
        addCoin(data: number) {
            this.chain.push(this.lastBlock().next(data));
            this.lastBlock().broadcast();
        }

        /**
         * Test if we have all the blocks in the chain available
         */
        isComplete() {
            for (let i = 0; i < this.chain.length; ++i)
                if (!this.chain[i]) return false; // missing block            
            return this.lastBlock().index == this.chain.length - 1;
        }

        /**
         * Test if the block chain is valid
         */
        isValid() {
            if (!this.isComplete()) {
                serial.writeLine("coin not complete");
                return false;
            }
            for (let i = 0; i < this.chain.length - 1; ++i) {
                const prev = this.chain[i];
                const next = this.chain[i + 1];
                if (prev.index + 1 != next.index) {
                    serial.writeLine("invalid index");
                    return false;
                }
                if (prev.hash != next.previousHash) {
                    serial.writeLine("invalid prev hash");
                }
                if (next.computeHash() != next.hash) {
                    serial.writeLine("invalid hash");
                    return false;
                }
            }
            return true;
        }

        /**
         * Insert a block received over the radio
         */
        insert(block: Block) {
            this.chain[block.index] = block;
        }

        /**
         * We've received a block chain and we are trying to replace the chain if it's been updated.
         */
        replace(other: BlockChain) {
            if (other.isValid() && other.chain.length > me.chain.length) {
                serial.writeLine("replacing chain");
                this.chain = other.chain.slice(0, other.chain.length);
                this.lastBlock().broadcast()
                basic.showIcon(IconNames.SmallSquare)
            }
        }

        /**
         * Broadcast the chains
         */
        broadcastChain() {
            for (let i = 0; i < this.chain.length; ++i) {
                this.chain[i].broadcast();
            }
        }
    }

    /**
     * Request all peers (or a single on) for the entire chain
     */
    function broadcastQueryChain(serialNumber: number = 0) {
        const msg = pins.createBuffer(6);
        msg.setNumber(NumberFormat.UInt8LE, 0, Message.QueryChain);
        msg.setNumber(NumberFormat.Int32LE, 2, serialNumber);
        radio.sendBuffer(msg);
    }

    const me = new BlockChain(0);
    const peers: BlockChain[] = [];

    /**
     * Get or create a block chain to store the blocks of a peer
     */
    function peer(id: number): BlockChain {
        for (let i = 0; i < peers.length; ++i) {
            if (peers[i].id == id) return peers[i];
        }
        const r = new BlockChain(id);
        peers.push(r);
        return r;
    }

    /**
     * Settings for the radio receiver
     */
    radio.setGroup(100);
    radio.setTransmitSerialNumber(true);
    radio.onDataPacketReceived(({ receivedBuffer, serial: serialNumber }) => {
        // processing a message received by ppers
        let id: number;
        switch (receivedBuffer[0]) {
            case Message.QueryChain:
                // so a peer asking to broadcast the chain
                serial.writeLine("msg: query chain");
                id = receivedBuffer.getNumber(NumberFormat.Int32LE, 2);
                // either all peers should send or just me
                if (!id || id == me.id) {
                    me.broadcastChain();
                    control.raiseEvent(BLOCKCHAIN_EVENT, BlockChainEvent.Broadcasted);
                }
                break;
            case Message.Block:
                // so we've received a block from a peer
                serial.writeLine("msg: block");
                const other = peer(serialNumber);
                const block = Block.receive(receivedBuffer);
                if (!block) return; // something got corrupted
                other.insert(block);
                serial.writeLine(`check ${other.lastBlock().index} > ${me.lastBlock().index}`)
                // if the other chain is longer, we should update ours maybe
                if (other.lastBlock().index > me.lastBlock().index) {
                    if (!other.isComplete()) {
                        // we don't have the entire chain
                        serial.writeLine(`peer incomplete`)
                        broadcastQueryChain(serialNumber);
                    } else {
                        // we have a full chain, try replacing it
                        serial.writeLine(`peer complete, try replace`)
                        me.replace(other);
                        control.raiseEvent(BLOCKCHAIN_EVENT, BlockChainEvent.Updated);
                    }
                }
                break;
        }
    })

    broadcastQueryChain();

    /**
     * Attempts to add a block to the blockchain
     * @param value data to be store in the block
     */
    //% blockId=radioblockaddblock block="add block %value|to blockchain"
    export function addBlock(value: number) {
        me.addCoin(value);
    }

    /** 
     * Number of blocks in the chain minus the genesis (first) block
    */
    //% blockId=radioblocklength block="blockchain length"
    export function length(): number {
        return me.chain.length - 1;
    }

    /**
     * Gets the values stored in the blockchain
     */
    //% blockId=radioblockchainvalues block="blockchain values"
    export function values(): number[] {
        let m = me.chain.map(chain => chain.data);    
        m.shift();
        return m;
    }

    /**
     * Gets the blocks that were inserted by a particular device
     * @param serialNumber serial number of the device
     */
    //% blockId=radioblockvaluesfrom block="blockchain values from %serialNumber"
    export function valuesFrom(serialNumber: number): number[] {
        return me.chain.filter(block => block.serialNumber == serialNumber)
            .map(chain => chain.data);
    }

    /**
     * Gets the serial numbers stored in each block the block chain
     */
    //% blockId=radioblockchainserialNumbers block="blockchain serial numbers"
    export function serialNumbers(): number[] {
        return me.chain.map(chain => chain.serialNumber);
    }

    /**
     * Registers a blockchain event
     * @param event 
     * @param handler 
     */
    //% blockId=radioblockchainonevent block="on blockchain %event"
    export function onEvent(event: BlockChainEvent, handler: () => void) {
        control.onEvent(BLOCKCHAIN_EVENT, event, handler);
    }

    /**
     * Gets the serial number of this device
     */
    //% blockId=radioblockchainid block="blockchain id"
    export function id(): number {
        return me.id;
    }
}