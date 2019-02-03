const { ApolloServer, PubSub, gql } = require('apollo-server');

const pubsub = new PubSub();
const CHAT_CHANNEL = 'CHAT_CHANNEL'
const logins = [];
const messages = [{
	id: 1,
	from: 'System',
	message: 'Welcome to Ubiquiti Chat!'
}];

const typeDefs = gql`
	# Add timestamp
	type Login {
		id: Int!,
		name: String!
	}

	# Add timestamp
	type Message {
		id: Int!
		from: String!
		message: String!
	}

	type Query {
		getMessages: [Message],
		getLogins: [Login]
	}

	type Mutation {
		sendMessage(from: String!, message: String!): Message,
		logIn(name: String!): Login,
		logOut(name: String!): Login
	}

	type Subscription {
		messageSent: Message
	}
`;

const resolvers = {
	Query: {
		getLogins: () => logins,
		getMessages: (root, args, context) => messages
	},

	Mutation: {
		sendMessage(root, {
			from,
			message
		}, {
			pubsub
		}) {
			const newMessage = {
				id: messages.length + 1,
				from,
				message
			}

			messages.push(newMessage)
			pubsub.publish(CHAT_CHANNEL, {
				messageSent: newMessage
			})

			return newMessage
		},
		logIn (root, {
			name
		}, {
			pubsub
		}) {
			const login = {
				id: logins.length + 1,
				name
			}

			logins.push(login)
			pubsub.publish(CHAT_CHANNEL, {
				messageSent: login
			})

			return login
		},
		logOut (root, {
			name
		}, {
			pubsub
		}) {
			logins.map((obj, index) => {
				if (obj.name === name) {
					logins.splice(index, 1);
				}
			})
		}
	},

	Subscription: {
		messageSent: {
			subscribe: (root, args, {
				pubsub
			}) => {
				return pubsub.asyncIterator(CHAT_CHANNEL)
			}
		}
	}
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: { pubsub }
});

server.listen().then(({ url, subscriptionsUrl }) => {
	console.log(`🚀 Server ready at ${url}`);
	console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
