import Config from 'config';
import braintree from 'braintree';


const gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: Config.Braintree_Configuration.merchantId,
    publicKey: Config.Braintree_Configuration.publicKey,
    privateKey: Config.Braintree_Configuration.privateKey,
});

export default gateway;