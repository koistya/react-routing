/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import useQueries from 'history/lib/useQueries';
import defaultTemplate from './DefaultTemplate';
import match from '../match';
import withContext from './withContext.node';

function render(template, component, context, actionResult) {
  const css = [];
  const content = ReactDOM.renderToString(withContext({
    insertCss: styles => css.push(styles._getCss()), // eslint-disable-line
    ...context,
  }, component));
  return content && `<!doctype html>\n${ReactDOM.renderToStaticMarkup(
    React.createElement(template || defaultTemplate, {
      /* start: default values */
      lang: '',
      title: '',
      description: '',
      meta: [],
      bundle: '/main.js',
      css: css.join(''),
      /* end: default values */
      context,
      ...actionResult,
      content,
    })
  )}`;
}

function createRouter(routes, { context, template } = {}) {
  return async (req, res, next) => {
    let result;
    let html;
    let ctx;
    try {
      ctx = {
        path: req.path,
        query: req.query,
        hash: null,
        history: useQueries(createMemoryHistory)(req.originalUrl),
        ...(context instanceof Function ? context(req) : context),
      };

      result = await match(routes, ctx);

      // Handle redirect
      if (result && (result.status === 301 || result.status === 302)) {
        res.redirect(result.status, result.content);
        return;
      }

      // Render React component
      if (result && result.component) {
        html = render(template, result.component, ctx, result);
      }

      if (!html) {
        const error = new Error('Not found');
        error.status = 404;
        throw error;
      }

      res.status(result.status || 200).send(html);
    } catch (error) {
      error.status = error.status || 500;
      try {
        result = await match(routes, { ...ctx, canonicalPath: req.path, path: '/error', error });

        if (result && result.component) {
          html = render(template, result.component, ctx, result);
        }

        if (html) {
          res.status(error.status).send(html);
        } else {
          next(error);
        }
      } catch (err) {
        next(err);
      }
    }
  };
}

export { default as Link } from './Link';
export { createRouter };
