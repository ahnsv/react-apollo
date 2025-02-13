import React, { useEffect } from 'react';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { MockedProvider, mockSingleLink } from '@apollo/react-testing';
import { render, cleanup } from '@testing-library/react';
import { ApolloProvider, useMutation } from '@apollo/react-hooks';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';

describe('useMutation Hook', () => {
  const CREATE_TODO_MUTATION: DocumentNode = gql`
    mutation createTodo($description: String!) {
      createTodo(description: $description) {
        id
        description
        priority
      }
    }
  `;

  const CREATE_TODO_RESULT = {
    createTodo: {
      id: 1,
      description: 'Get milk!',
      priority: 'High',
      __typename: 'Todo'
    }
  };

  afterEach(cleanup);

  describe('General use', () => {
    it('should handle a simple mutation properly', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let renderCount = 0;
      const Component = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );
        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            createTodo({ variables });
            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });

    it('should be able to call mutations as an effect', done => {
      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      let renderCount = 0;
      const useCreateTodo = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION
        );

        useEffect(() => {
          createTodo({ variables });
        }, [variables]);

        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      const Component = () => {
        useCreateTodo();
        return null;
      };

      render(
        <MockedProvider mocks={mocks}>
          <Component />
        </MockedProvider>
      );
    });
  });

  describe('Optimistic response', () => {
    it('should support optimistic response handling', done => {
      const optimisticResponse = {
        __typename: 'Mutation',
        createTodo: {
          id: 1,
          description: 'TEMPORARY',
          priority: 'High',
          __typename: 'Todo'
        }
      };

      const variables = {
        description: 'Get milk!'
      };

      const mocks = [
        {
          request: {
            query: CREATE_TODO_MUTATION,
            variables
          },
          result: { data: CREATE_TODO_RESULT }
        }
      ];

      const link = mockSingleLink(...mocks);
      const cache = new InMemoryCache();
      const client = new ApolloClient({
        cache,
        link
      });

      let renderCount = 0;
      const Component = () => {
        const [createTodo, { loading, data }] = useMutation(
          CREATE_TODO_MUTATION,
          { optimisticResponse }
        );

        switch (renderCount) {
          case 0:
            expect(loading).toBeFalsy();
            expect(data).toBeUndefined();
            createTodo({ variables });

            const dataInStore = client.cache.extract(true);
            expect(dataInStore['Todo:1']).toEqual(
              optimisticResponse.createTodo
            );

            break;
          case 1:
            expect(loading).toBeTruthy();
            expect(data).toBeUndefined();
            break;
          case 2:
            expect(loading).toBeFalsy();
            expect(data).toEqual(CREATE_TODO_RESULT);
            done();
            break;
          default:
        }
        renderCount += 1;
        return null;
      };

      render(
        <ApolloProvider client={client}>
          <Component />
        </ApolloProvider>
      );
    });
  });
});
