import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
const axios = require('axios');
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')


import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTVal from '../artifacts/contracts/NFTVal.sol/NFTVal.json'

let pinataapi = null
let pinatasec = null


if (process.env.NEXT_PUBLIC_PINATAAPI) {
  pinataapi = process.env.NEXT_PUBLIC_PINATAAPI
}
if (process.env.NEXT_PUBLIC_PINATASEC) {
  pinatasec = process.env.NEXT_PUBLIC_PINATASEC
}



export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const [tokenURI, setTokenURI] = useState(null)
  const router = useRouter()

  async function onUpload(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
 }
  /* function to upload to IPFS */
  async function pinJSONToIPFS(JSONBody) {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`
    //making axios POST request to Pinata
    return axios
      .post(url, JSONBody, {
        headers: {
          pinata_api_key: pinataapi,
          pinata_secret_api_key: pinatasec,
        }
      })
      .then(function (response) {
        return {
          success: true,
          pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
        }

      })
      .catch(function (error) {
        console.log(error)
        return {
          success: false,
          message: error.message,
        }

      })

  } 

  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return

     //make metadata
    const metadata = new Object();
    metadata.name = name;
    metadata.image = fileUrl;
    metadata.description = description;

    //make pinata call
    const pinataResponse = await pinJSONToIPFS(metadata);
    if (pinataResponse.success) {
      setTokenURI(pinataResponse.pinataUrl);
      createSale(pinataResponse.pinataUrl);
    }
    
     /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
     
  } 

  

  async function createSale(tokenURI) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)    
    const signer = provider.getSigner()
    
    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    console.log(tokenURI)
    let transaction = await contract.createToken(tokenURI) //pinataresponseurl same which entered into createSale()
    console.log(transaction)
    let tx = await transaction.wait()
    console.log(tx)
    let event = tx.events[0]
    console.log(event)
    let value = event.args[2]
    let tokenId = value.toNumber()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')
  
    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, NFTVal.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    await transaction.wait()
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="NFT Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="NFT Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="NFT Price in MATIC"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="NFT"
          className="my-4"
          onChange={onUpload}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" alt="" src={fileUrl} />
          )
        }
        <button onClick={createMarket} className="font-bold mt-4 bg-blue-400 hover:bg-blue-500 hover:text-white rounded p-4 shadow-lg">
          Mint the NFT
        </button>
      </div>
    </div>
   )
      }
