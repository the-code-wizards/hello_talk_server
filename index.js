const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const stripe = require("stripe")("sk_test_51M7c2bCrl3dQ57EJMOlipKJpX43py1TqYR0wIuxSuUqrCNs5wm5ZZqbdfoC9Sg4pPnoRjyK555NERoxbngBBbRhS00TlyNUFoE");

const jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()

//port of the server
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


// const levels = require('/data/course.json');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ke0m0t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: "unathorized access"})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(401).send({message: "unathorized access"})
        }
        req.decoded = decoded;
        next()
    })
}

async function run(){
    try{
        const coursesCollection = client.db('hello-Talk').collection('coursesCollection');
        const paymentsCollection = client.db('hello-Talk').collection('paymentsCollection');
        const levelsCollcetion = client.db('hello-Talk').collection('levelsCollcetion');
        const blogsCollection = client.db('hello-Talk').collection('blogsCollection');
        const usersCollection = client.db('hello-Talk').collection('usersCollection');
        const userCollection = client.db('hello-Talk').collection('userCollection');
        const reviewsCollection = client.db('hello-Talk').collection('reviewsCollection');
        const YquizCollection = client.db('hello-Talk').collection('YquizCollection');
        const AquizCollection = client.db('hello-Talk').collection('AquizCollection');
        const faqCollection = client.db('hello-Talk').collection('faqCollection');
        const flashcardCollection = client.db('hello-Talk').collection('flashcardCollection');
        const teachersCollection = client.db('hello-Talk').collection('teachersCollection');
        const communityPostsCollection = client.db('hello-Talk').collection('communityPostsCollection');
        const postlikes = client.db('hello-Talk').collection('postlikes');
        const postcomment = client.db('hello-Talk').collection('postcomment');


        //payment system
        // -------------------Stripe-------------
        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post("/payments", async (req, res) => {
            const payments = req.body
            console.log(payments)
            const result = await paymentsCollection.insertOne(payments)
            res.send(result);

        });


        //-----------------stripe end---------------

        //get courses data from mongodb
        app.get('/courses', async (req, res) => {
            const query = {};
            const result = await coursesCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/course/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)}
            const result = await coursesCollection.findOne(query);
            res.send(result);
        });

        //update the course
        app.post('/course', async(req, res) => {
            const id = req.query.id;
            const coursedata = req.body;
            const {
                title1,
                picture1,
                details1,
                date1,
                price1,
                offer_price1
            } = coursedata;

            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    title: title1,
                    picture: picture1,
                    details: details1,
                    date: date1,
                    price: price1,
                    offer_price: offer_price1
                }
            }
            
            const result = await coursesCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.delete('/course/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await coursesCollection.deleteOne(query)
            res.send(result);
        })

        //\___________________all blog apis CRUD oparation start_________________/\\
        //post blog api
        app.post('/blog', async(req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog)
            res.send(result)
        })

        //get all blogs
        app.get('/blogs', async (req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).toArray();
            res.send(result);
        })

        //two blogs api for show in home page
        app.get('/hblogs', async (req, res) => {
            const query = {};
            const result = await blogsCollection.find(query).limit(2).toArray();
            res.send(result);
        })

        //get the single blog
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const result = await blogsCollection.findOne(query);
            res.send(result)
        })

        //edit blogs by post
        app.post('/upblog', async(req, res) => {
            const id = req.query.id;
            const blogdata = req.body;
            const {
                title1,
                details1,
                date1,
                author_name1,
                author_img1,
                image1,
                tag1,
                package1,
                gems1,
                age1
            } = blogdata;

            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    title: title1,
                    details: details1,
                    date: date1,
                    author_name: author_name1,
                    author_img: author_img1,
                    image: image1,
                    tag: tag1,
                    package: package1,
                    gems: gems1,
                    age: age1
                }
            }
            const result = await blogsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        //delete blog 
        app.delete('/blogs/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)}
            const result = await blogsCollection.deleteOne(query);
            res.send(result)
        })
        //\__________________________blogs end______________________________/\\

        //post review in database
        app.post('/postreview', async(req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        })

        //get the review api from mongodb
        app.get('/reviews', async(req, res) => {
            const query = {};
            const result = await reviewsCollection.find(query).toArray();
            res.send(result);
        });

        //get single review of indecated user
        app.get('/review', async(req, res) => {
            const reqemail = req.query.email;
            const query = {email: reqemail}
            if(reqemail){
                const result = await reviewsCollection.findOne(query);
                res.send(result)
            }
            else{
                const error = {message: "no email found"}
            }
        })

        //frequently asked question 
        app.get('/faq', async ( req, res) => {
            const query = {};
            const result = await faqCollection.find(query).toArray();
            res.send(result)
        })

        //flashcardCollection 
        app.get('/flashcard', async (req, res) => {
            const query = {}; 
            const result = await flashcardCollection.find(query).toArray();
            res.send(result)
        })

        //get quizzes api - checking age
        app.get('/quizes', async(req, res) => {
            const age = req.query.age
            const query = {};
            if(age === 'young'){
                const result = await YquizCollection.find(query).toArray();
                res.send(result)
            }
            if(age === 'adult'){   
                const result = await AquizCollection.find(query).toArray();
                res.send(result)
            }
            else{
                const result = {message: "No data found"}
                res.send(result)
            }
        })
        
        //get all the levels
        app.get('/levels', async (req, res) => {
            const query = {};
            const result = await levelsCollcetion.find(query).toArray()
            console.log(result)
            res.send(result)
        })

        app.get('/levels/:level', async (req, res) => {
            const level = req.params.level;
            const query = {level: level};
            const result = await levelsCollcetion.find(query).toArray()
            console.log(result)
            res.send(result)
        })

        app.get('/level/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await levelsCollcetion.findOne(query)
            console.log(result)
            res.send(result)
        })

        //save the level when it complete in userCollection
        app.post('/savelevel', async(req, res) => {
            const newLevel = req.body;
            const {completed_lv} = newLevel;
            const email = req.query.email;
            const filter = {email: email};
            const options = {upsert: true};
            const updatedDoc = {
                $push: {
                    completed_lv: completed_lv
                }
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options) 
            res.send(result)
        });

        //check levels
        app.get('/filterlevel', async(req, res) => {
            const email = req.query.email;
            const getUser = userCollection.find(user => user.email === email);
            const completedlv = getUser.completed_lv;

        })

        //authentication
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };

            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ result, token });
        })

        //post my profile
        app.post('/user', async(req, res) => {
            const userdetail = req.body;
            const result = await userCollection.insertOne(userdetail);
            res.send(result)
        })

        //update my profile with all information
        app.post('/upuser', async(req, res) => {
            const userbio = req.body;
            const {name, age, education, district, country, number, email, realAge } = userbio;
            const useremail = req.query.email;
            const filter = {email: useremail};
            const options = {upsert: true}
            const updateDoc = {
                $set:{
                    name,
                    age,
                    realAge,
                    education,
                    district, 
                    country,
                    number,
                    email
                }
            }

            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        //get all the users
        app.get('/users', async(req, res) => {
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result) 
        })


        //get all the users saved on usercollection
        app.get('/allusers', async(req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray();
            res.send(result)
        })

        //get single user api
        app.get('/profile', async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const result = await userCollection.findOne(query);
            res.send(result) 
        });

        //make a user to admin
        app.put('/makeadmin', async(req, res) => {
            const email = req.query.email;
            const filter = {email: email}
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        //update gems by answering the question
        app.post('/addgem', async (req, res) => {
            const email = req.query.email;
            const mygem = req.body;
            //get the new gems
            const {mGem} = mygem
            
            //find for get the user of previous gems
            const getUser = await userCollection.findOne({email: email})
            const {gems} =  getUser;
            
            const filter = {email: email};
            const options = {upsert: true};
            const updatedDoc= {
                $set: {
                    gems: gems + mGem
                }
            };

            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        //delete an user from database
        app.delete('/profile/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        //get all the teachers and description
        app.get('/teachers', async (req, res) => {
            const query = {};
            const teachers = await teachersCollection.find(query).toArray();
            res.send(teachers)
        })

        //get single teacher
        app.get('/teacher/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const result = await teachersCollection.findOne(query);
            res.send(result);
        });

        //post method community quesions or others
        app.post('/addapost', async(req, res) => {
            const question = req.body;
            const result = await communityPostsCollection.insertOne(question);
            res.send(result)
        });

        app.get('/communityposts', async(req, res) => {
            const query = {};
            const result = await communityPostsCollection.find(query).toArray();
            res.send(result)
        });

        app.post('/postlike', async(req, res) =>{
            const likebody = req.body;
            const result = await postlikes.insertOne(likebody);
            res.send(result)
        })

        app.get('/postlike', async (req, res) => {
            const query = {}
            const communitybody = await postlikes.find(query).toArray()
            res.send(communitybody)
        })

        app.post('/postcomment', async(req, res) =>{
            const communitybody = req.body;
            const result = await postcomment.insertOne(communitybody);
            res.send(result)
        })

        //post comment for community
        app.get('/postcomment', async (req, res) => {
            const result = await postcomment.find({}).toArray();
            res.send(result);
        })

        app.get('/comment', async (req, res) => {
            const postid = req.query.id;
            const query = {pid: postid};
            const result = await postcomment.find(query).toArray();
            res.send(result);
        })
        

    }

    finally{

    }
}
run().catch(err => {
    console.error(err);
})

app.get('/', (req, res) => {
  res.send(`
    <p>
        <h1>Welcome to Hello_talk Server 🎉</h1>
        <h3>Let's do it</h3>
    </p>
  `)
})

app.listen(port, () => {
  console.log(`Hello talk app listening on port ${port}`)
})

//Export the express api
module.exports = app;