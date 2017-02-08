import React, { PropTypes, Component } from 'react';
import { List, fromJS } from 'immutable';

class TreeCheckbox extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    checkedItems: PropTypes.any,
    label: PropTypes.string,
    defaultChecked: PropTypes.bool,
  };

  getLiParents = (el, parentSelect) => {
    let parentSelector = parentSelect;
    if (!parentSelector) parentSelector = document;
    const parents = [];
    let parent = el.parentNode;
    let o;
    while (parent !== parentSelector) {
      o = parent;
      if (parent.tagName === 'LI') parents.push(o);
      parent = o.parentNode;
    }
    return parents;
  }

  traverseDOMUpwards = (startingEl, steps) => {
    let elem = startingEl;
    for (let i = 0; i < steps; i++) {
      elem = elem.parentNode;
    }
    return elem;
  };

  markIt = (nodeElem, indeter, checkIt) => {
    const node = nodeElem;
    node.indeterminate = indeter;
    node.checked = checkIt;
  };

  changeInput = (e) => {
    const { onChange, checkedItems } = this.props;
    const selector = 'input[type="checkbox"]';
    const querySelector = (el) => el.querySelectorAll(selector);
    const container = this.traverseDOMUpwards(e.target, 1);
    const markAllChildren = querySelector(container.parentNode);
    const getAllChildrenlabels = container.parentNode.querySelectorAll('label');
    let checked = e.target.tagName === 'LABEL' ? !markAllChildren[0].checked : e.target.checked

    const getCheckboxes = (elContainer, markParents, indeter, checkIt, allAreSame) => {
      let childCheckbox = elContainer;
      if (markParents && allAreSame) {
        this.markIt(querySelector(childCheckbox)[0], indeter, checkIt);
      } else if (markParents) {
        childCheckbox = this.getLiParents(elContainer);
        for (let i = 0; i < childCheckbox.length; i++) {
          this.markIt(querySelector(childCheckbox[i])[0], indeter, checkIt);
          checkedItems(childCheckbox[i].querySelectorAll('label')[0].innerText, checkIt);
        }
      } else childCheckbox = querySelector(childCheckbox);
      return childCheckbox;
    };

    const checkRelatives = (ele) => {
      let el = ele;
      if (el.tagName === 'DIV') el = el.parentNode;
      if (el.tagName !== 'LI') return;
      const parentContainer = this.traverseDOMUpwards(el, 2);
      const siblingsCheck = (element) => {
        let onesNotRight = false;
        const sibling = [].slice.call(element.parentNode.children);
        sibling.filter(child => child !== element).forEach(elem => {
          if (querySelector(elem)[0].checked !== querySelector(element)[0].checked) {
            onesNotRight = true;
          }
        });
        return !onesNotRight;
      };
      if (siblingsCheck(el) && checked) {
        getCheckboxes(parentContainer, true, false, true, true);
        checkRelatives(parentContainer);
      } else if (siblingsCheck(el) && !checked) {
        const indeter = parentContainer.querySelectorAll(`${selector}:checked`).length > 0;
        getCheckboxes(parentContainer, true, indeter, false, true);
        checkRelatives(parentContainer);
      } else getCheckboxes(el, true, true, false);
    };

    for (const children of markAllChildren) {
      this.markIt(children, false, checked);
    }
    for (const label of getAllChildrenlabels) {
      checkedItems(label.innerText, checked);
    }
    checkRelatives(container);
    if (onChange) onChange(e, { checked, ...this.props });
  };

  render() {
    const { label } = this.props;
    return (
      <div className='ui checkbox'>
        <input
          type='checkbox'
          onChange={this.changeInput}
        />
        <label onClick={this.changeInput} style={{ cursor: 'pointer' }}>
          {label}
        </label>
      </div>
    );
  }
}

export default class TreeView extends Component {
  static propTypes = {
    data: PropTypes.any.isRequired,
    checkItems: PropTypes.func.isRequired,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    checkItems: () => {},
    data: fromJS([
      { name: 1,
        label: 'My Documents',
        items: [
          { name: 2,
            label: 'Kendo UI Project',
            items: [
              { name: 3,
                label: 'about.html',
                items: [
                 { name: 15, label: 'nope.html' },
                 { name: 6, label: 'really long.png' },
                ],
             },
             { name: 4, label: 'index.html' },
             { name: 5, label: 'logo.png' },
            ],
         },
         { name: 6,
           label: 'New Web Site',
           items: [
             { name: 7, label: 'mockup.jpg' },
             { name: 8, label: 'Research.pdf' },
           ],
         },
        ],
      },
      { name: 9,
        label: 'Reports',
        items: [
          { name: 10,
            label: 'February.pdf',
            items: [
              { name: 11, label: 'March.pdf' },
              { name: 12, label: 'Jan.pdf' },
            ],
          },
          { name: 13, label: 'April.pdf' },
          { name: 14, label: 'December.pdf', checked: true },
        ],
      },
    ]),
  };

  returnCheckedItems = (item, checked) => {
    if (this.checkedItems.includes(item) && !checked) {
      this.checkedItems = this.checkedItems.splice(this.checkedItems.indexOf(item), 1);
      this.props.checkItems(this.checkedItems);
    } else if (!this.checkedItems.includes(item) && checked) {
      this.checkedItems = this.checkedItems.push(item);
      this.props.checkItems(this.checkedItems);
    }
  }

  render() {
    const { data, onChange } = this.props;
    this.checkedItems = new List();
    const buildCheckmarks = (dataArr) =>
      <ul key={Math.random()} style={{ listStyle: 'none' }}>
        {dataArr.map(child =>
          <li key={child.get('name')} style={{ margin: '1em 0px' }}>
            <TreeCheckbox
              onChange={onChange}
              label={child.get('label')}
              checkedItems={(item, checked) => this.returnCheckedItems(item, checked)}
            />
            {child.get('items') ? buildCheckmarks(child.get('items')) : null}
          </li>
        )}
      </ul>;

    return (
      <div>
        {buildCheckmarks(data)}
      </div>
    );
  }
}
