const WalletSchema = require('../../model/walletModel')
const userSchema = require('../../model/userModel');
const mongoose = require('mongoose')

const loadWallet = async(req,res)=>{
    try {

        const wallet = await WalletSchema.findOne({ user_id: req.session.user._id})
        const history = wallet.history
    
        
        res.render('wallet',{wallet,history})
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = {
    loadWallet
};