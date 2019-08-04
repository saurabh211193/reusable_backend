import awsRouter from './api/controllers/aws/routes';
import userRouter from './api/controllers/user/routes';
import socialRouter from './api/controllers/social/routes';
import youtubeRouter from './api/controllers/youtube/routes';
import pdfRouter from './api/controllers/pdf/routes';
import adminRouter from './api/controllers/admin/routes';
import paymentRouter from './api/controllers/payment/routes';
import ecommerceRouter from './api/controllers/ecommerce/routes';

/**
 *
 *
 * @export
 * @param {any} app
 */
export default function routes(app) {
    app.use('/awsuser', awsRouter);
    app.use('/user', userRouter);
    app.use('/social', socialRouter);
    app.use('/youtube', youtubeRouter);
    app.use('/pdf', pdfRouter);
    app.use('/admin', adminRouter);
    app.use('/payment', paymentRouter);
    app.use('/ecommerce', ecommerceRouter);
    // show the home page (will also have our login links)
    app.get('/user', function (req, res) {
        res.render('index.ejs');
    });
    // show the home page (will also have our login links)
    app.get('/fbuser', function (req, res) {
        res.render('fb.ejs');
    });

    // show the home page (will also have our login links)
    app.get('/googleuser', function (req, res) {
        res.render('google.ejs');
    });
    return app;
}