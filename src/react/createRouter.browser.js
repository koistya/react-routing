/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import ReactDOM from 'react-dom';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import useQueries from 'history/lib/useQueries';
import match from '../match';
import withContext from './withContext.browser';

let history;

async function render(routes, location, { context, onError, onRenderComplete }, container) {
  let result;
  const ctx = {
    path: location.pathname,
    query: location.query,
    hash: location.hash,
    history,
    ...(context instanceof Function ? context() : context),
  };
  try {
    result = await match(routes, ctx);

    // Handle redirect
    if (result && (result.status === 301 || result.status === 302)) {
      location.push(result.content);
      return;
    }

    if (result && result.component) {
      await new Promise((resolve, reject) => {
        try {
          ReactDOM.render(withContext({
            insertCss: styles => styles._insertCss(),
            ...ctx,
          }, result.component), container, () => {
            document.title = result.title || '';
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
      if (onRenderComplete) {
        onRenderComplete();
      }
    } else {
      const error = new Error('Not found');
      error.status = 404;
      throw error;
    }
  } catch (error) {
    error.status = error.status || 500;
    try {
      result = await match(routes, {
        ...ctx,
        canonicalPath: location.pathname,
        path: '/error',
        error,
      });
      if (result && result.component) {
        await new Promise((resolve, reject) => {
          try {
            ReactDOM.render(withContext({
              insertCss: styles => styles._insertCss(),
              ...ctx,
            }, result.component), container, () => {
              document.title = result.title || '';
              resolve();
            });
          } catch (err) {
            reject(err);
          }
        });
      }
    } catch (err) {
      console.error(err.stack);
      throw err;
    }
    console.error(error.stack);
    throw error;
  }
}

function createRouter(routes, context, container) {
  history = useQueries(createBrowserHistory)();
  history.listen(location => {
    render(routes, location, context, container);
  });
}

export { default as Link } from './Link';
export { createRouter };
