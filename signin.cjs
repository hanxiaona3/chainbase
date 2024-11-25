const ethers=require('ethers')
const axios=require('axios')
const {PrivateKeys$18Wallets,PrivateKeys$3Wallets}=require('../../util/privateKey.cjs');
const {generateNonce}=require('../../util/sign_nonce.cjs')
const fakeUa = require('fake-useragent');
const RPC=require('../../config/runnerRPC-1.json');
const {sleep}=require('../../util/common.cjs')
const { HttpsProxyAgent } = require('https-proxy-agent')


const message_URL='https://api.chainbase.com/twm/v1/sign-in/message?address=';
const sign_URL='https://api.chainbase.com/twm/v1/sign-in';
const inviter_URL='https://api.chainbase.com/twm/v1/points/inviter';

//header获取
function getHeaders(userAgent=''){
    let options={
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'origin': 'https://genesis.chainbase.com',
        'priority': 'u=1, i',
        'referer': 'https://genesis.chainbase.com/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': userAgent,
    }
    return options;
};
//claimHeaders获取
function getClaimHeaders(bearer,userAgent = ''){
    let headers = getHeaders(userAgent)
    // const bearer = "bearer " + Buffer.from(`eoa:${token}`).toString('base64');
    headers.Authorization = bearer
    return headers;
}

//获取网站登录的VerifyMessage值
async function getVerifyMessage(headers,message_URL){
    try{
        const response = await axios.get(message_URL, { 
            headers: headers
        });
        const verify_message = response.data.verify_message;
        // console.log(verify_message);
        
        return verify_message;
    }catch(error){
        console.error('获取verify_message字符发生错误:', error.message);
        return null;
    }
}

//网站登录的nonce值
// const wallet=new ethers.Wallet(privateKey,provider);
async function login(wallet,headers){

    const address=wallet.address;
    const message1_URL=`${message_URL}${address}`;
    const verify_message=await getVerifyMessage(headers,message1_URL);
    const now=new Date();
    const nonce=generateNonce()
    console.log(`地址是：${address}，nonce是:${nonce}`);
    const message=`genesis.chainbase.com wants you to sign in with your Ethereum account:\n${address}\n\n${verify_message}\n\nURI: https://genesis.chainbase.com\nVersion: 1\nChain ID: 2233\nNonce: ${nonce}\nIssued At: ${now.toISOString()}`
    // console.log(message);
    
    const signature=await wallet.signMessage(message);
    // console.log(signature);
    
    const data={
        message:message,
        signature:signature
    }
    try{
        const response = await axios.post(sign_URL, data,{ 
            headers: headers
        });
        const token = response.data.token;
        const bearer = "Bearer " + token;
        return bearer;
    }catch(error){
        console.error('登录网址发生错误:', error.message);
        return null;
    }
}

//inviter函数
async function inviterPerson(claimHeaders){
    try{
        const response = await axios.post(inviter_URL,{referral_code:"OS569ES98"}, { 
            headers: claimHeaders
        });
        const invited_x=response.data.invited;
        console.log(invited_x);
        return invited_x;

    }catch(error){
        console.error('邀请发生错误:', error.message);
        return null;
    }
}


const main=async(privateKeys)=>{

    const morphl2_Provider=new ethers.JsonRpcProvider(RPC.chainbase)
//循环获取数量
    for (let index =9; index <12; index++) {//shuffled_PrivateKeys.length
        let userAgent = fakeUa();
        const morphl2_wallet=new ethers.Wallet(privateKeys[index],morphl2_Provider);
        // const holesky_wallet=new ethers.Wallet(privateKeys[index],holesky_Provider);

        console.log(`第${index+1}个钱包`);
        
        let headers=getHeaders(userAgent);
        let bearer=await login(morphl2_wallet,headers);
        let claimHeaders=getClaimHeaders(bearer,userAgent);
        await inviterPerson(claimHeaders);
        await sleep(10)
        // console.log(bearer);
        
    }

}

main(PrivateKeys$18Wallets)