const walletSchema = require('../../model/walletModel.js');
const userSchema = require('../../model/userModel');


const wallet = async (req,res)=>{
    try {
        res.render('wallet')
    } catch (error) {
       console.log(error);
        
    }
}

// const createWalletForUser  = async (userId) => {
//     try {
//         const existingWallet = await walletSchema.findOne({ userId });
//         if (!existingWallet) {
//             const wallet = new walletSchema({ userId });
//             await wallet.save();
//             console.log('Wallet created for user:', userId);
//         } else {
//             console.log('Wallet already exists for user:', userId);
//         }
//     } catch (error) {
//         console.error('Error creating wallet:', error);
//     }
// };

// const getWalletDetails = async (req, res) => {
//     try {
//         const userId = req.session.user._id; 
//         const wallet = await walletSchema.findOne({ userId }).populate('userId', 'name email');
//         if (!wallet) {
//             return res.status(404).json({ error: 'Wallet not found' });
//         }
//         res.status(200).json({ balance: wallet.balance, transactions: wallet.transactions });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to fetch wallet details' });
//     }
// };
module.exports = {
    wallet,
//     createWalletForUser,
//     getWalletDetails
    
}