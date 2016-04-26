/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import jsdom from 'mocha-jsdom';
import { expect } from 'chai';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import createRouter from '../../src/react/createRouter.browser';

createRouter.__Rewire__('createBrowserHistory', createMemoryHistory);

describe('createRouter.browser', () => {
  jsdom({
    useEach: true,
    html: '<!doctype html><html><head><meta charset="utf-8"></head>' +
          '<body><div id="container"></div></body></html>',
  });

  it('should render a React component', async (done) => {
    const container = document.getElementById('container');
    const routes = {
      path: '/',
      action: () => ({
        title: 'Test',
        component: <p>Test</p>,
      }),
    };
    const options = {
      onRenderComplete: () => {
        expect(container.innerHTML).to.be.equal('<p data-reactroot="">Test</p>');
        done();
      },
    };
    createRouter(routes, options, container);
  });
});
