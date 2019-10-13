import gql from 'graphql-tag';

export default gql`
  type Lifetime {
    born: Int!
    died: Int
  }

  input QueryOptions {
    limit: Int = 100
    offset: Int = 0
  }

  type Author {
    id: ID
    lifetime: Lifetime
    name: String
    alias: String
    influences: [Author]
    influenced: [Author]
    contemporaries: [Author]
    texts: [Text]
    thumbnail: String
  }

  type Text {
    id: ID!
    url: String!
    title: String
    authors: [Author]
    subject: [String]
  }

  type Query {
    author(id: ID!): Author
    authors(options: QueryOptions): [Author]!
    texts(options: QueryOptions): [Text]!
    text(id: ID!): Text
  }

  input SaveAuthorInput {
    id: ID
    birthdate: String
    deathdate: String
    name: String
    aliases: [String]
    influences: [SaveAuthorInput]
    influenced: [SaveAuthorInput]
    contemporaries: [SaveAuthorInput]
    texts: [SaveTextInput]
    thumbnail: String
  }

  input SaveTextInput {
    id: ID
    url: String!
    title: String
    authors: [SaveAuthorInput]
  }

  type Mutation {
    saveText(textInput: SaveTextInput!): Text!
  }
`;
