import { mount } from 'enzyme';
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import merge from 'lodash/merge';
import { Add20, ArrowRight16, Add16 } from '@carbon/icons-react';

import { settings } from '../../constants/Settings';
import { Modal } from '../Modal';

import { getTableColumns, mockActions, getNestedRows, getNestedRowIds } from './Table.test.helpers';
import Table, { defaultProps } from './Table';
import TableToolbar from './TableToolbar/TableToolbar';
import TableBodyRow from './TableBody/TableBodyRow/TableBodyRow';
import TableHead from './TableHead/TableHead';
import { initialState } from './Table.story';

const { iotPrefix, prefix } = settings;

const selectData = [
  {
    id: 'option-A',
    text: 'option-A',
  },
  {
    id: 'option-B',
    text: 'option-B',
  },
  {
    id: 'option-C',
    text: 'option-C',
  },
];
const tableColumns = getTableColumns(selectData);

const words = [
  'toyota',
  'helping',
  'whiteboard',
  'as',
  'can',
  'bottle',
  'eat',
  'chocolate',
  'pinocchio',
  'scott',
];
const getWord = (index, step = 1) => words[(step * index) % words.length];
const getSentence = (index) =>
  `${getWord(index, 1)} ${getWord(index, 2)} ${getWord(index, 3)} ${index}`;

const tableData = Array(20)
  .fill(0)
  .map((i, idx) => ({
    id: `row-${idx}`,
    values: {
      string: getSentence(idx),
      node: <Add20 />,
      date: new Date(100000000000 + 1000000000 * idx * idx).toISOString(),
      select: selectData[idx % 3].id,
      number: idx * idx,
    },
    rowActions: [
      {
        id: 'drilldown',
        renderIcon: ArrowRight16,
        iconDescription: 'Drill in',
        labelText: 'Drill in',
        isOverflow: true,
      },
      {
        id: 'Add',
        renderIcon: Add16,
        iconDescription: 'Add',
        labelText: 'Add',
        isOverflow: true,
      },
    ],
  }));

const largeTableData = Array(100)
  .fill(0)
  .map((i, idx) => ({
    id: `row-${idx}`,
    values: {
      string: getSentence(idx),
      node: <Add20 />,
      date: new Date(100000000000 + 1000000000 * idx * idx).toISOString(),
      select: selectData[idx % 3].id,
      number: idx * idx,
    },
  }));

const RowExpansionContent = ({ rowId }) => (
  <div key={`${rowId}-expansion`} style={{ padding: 20 }}>
    <h3 key={`${rowId}-title`}>{rowId}</h3>
    <ul style={{ lineHeight: '22px' }}>
      {Object.entries(tableData.find((i) => i.id === rowId).values).map(([key, value]) => (
        <li key={`${rowId}-${key}`}>
          <b>{key}</b>: {value}
        </li>
      ))}
    </ul>
  </div>
);

const i18nTest = {
  /** table body */
  overflowMenuAria: 'overflow-menu',
  clickToExpandAria: 'expand-aria',
  clickToCollapseAria: 'collapse-aria',
  selectAllAria: 'select-all',
  selectRowAria: 'select-row',
  /** toolbar */
  clearAllFilters: 'clear-filters',
  columnSelectionButtonAria: 'column-select-aria',
  columnSelectionConfig: 'column-select-config',
  filterButtonAria: 'filter-aria',
  editButtonAria: 'edit-button',
  searchLabel: 'search-label',
  searchPlaceholder: 'search-placeholder',
  clearFilterAria: 'clear-filter',
  filterAria: 'filter-aria',
  openMenuAria: 'open-menu',
  batchCancel: 'cancel',
  itemSelected: 'item-selected',
  itemsSelected: 'items-selected',
  /** empty state */
  emptyMessage: 'empty-message',
  emptyMessageWithFilters: 'empty-filters',
  emptyButtonLabel: 'empty-button',
  downloadIconDescription: 'download-descript',
};

const i18nDefault = defaultProps({}).i18n;

describe('Table', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  const options = {
    hasRowExpansion: true,
    hasRowCountInHeader: true,
    hasRowActions: true,
  };
  const options2 = {
    hasRowExpansion: true,
    hasRowCountInHeader: false,
  };

  const tableState = {
    totalSelected: 0,
    batchActions: [],
  };
  const view = {
    filters: [],
    pagination: {
      totalItems: tableData.length,
    },
    table: {
      expandedIds: ['row-1'],
    },
  };

  const expandedData = [
    {
      rowId: 'row-1',
      content: <RowExpansionContent rowId="row-1" />,
    },
  ];

  it('should be selectable with testId or id', () => {
    const { rerender } = render(
      <Table
        columns={tableColumns}
        data={tableData.slice(0, 1)}
        expandedData={expandedData}
        actions={mockActions}
        options={{
          ...options,
          hasAggregations: true,
        }}
        view={{
          ...view,
          aggregations: {
            label: 'Total: ',
            columns: [
              {
                id: 'number',
              },
            ],
          },
        }}
        testId="__table__"
      />
    );
    expect(screen.getByTestId('__table__')).toBeDefined();
    expect(screen.getByTestId('__table__-table-container')).toBeDefined();
    expect(screen.getByTestId('__table__-table-toolbar')).toBeDefined();
    expect(screen.getByTestId('__table__-table-toolbar-content')).toBeDefined();
    expect(screen.getByTestId('__table__-table-toolbar-batch-actions')).toBeDefined();
    expect(screen.getByTestId('download-button')).toBeDefined();
    expect(screen.getByTestId('__table__-table-head')).toBeDefined();
    expect(screen.getByTestId('__table__-table-head-column-string')).toBeDefined();
    expect(screen.getByTestId('__table__-table-body')).toBeDefined();
    expect(screen.getByTestId('__table__-table-head-row-expansion-column')).toBeDefined();
    expect(screen.getByTestId('table-head--overflow')).toBeDefined();
    userEvent.click(screen.getByTestId('table-head--overflow'));
    expect(
      screen.getByTestId(`__table__-table-toolbar-toolbar-overflow-menu-item-aggregations`)
    ).toBeDefined();
    // close menu
    userEvent.click(screen.getByTestId('table-head--overflow'));
    rerender(
      <Table
        columns={tableColumns}
        data={tableData.slice(0, 1)}
        expandedData={expandedData}
        actions={mockActions}
        options={{
          ...options,
          hasAggregations: true,
        }}
        view={{
          ...view,
          aggregations: {
            label: 'Total: ',
            columns: [
              {
                id: 'number',
              },
            ],
          },
        }}
        id="__TABLE__"
      />
    );

    expect(screen.getByTestId('__TABLE__')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-container')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-toolbar')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-toolbar-content')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-toolbar-batch-actions')).toBeDefined();
    expect(screen.getByTestId('download-button')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-head')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-head-column-string')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-body')).toBeDefined();
    expect(screen.getByTestId('__TABLE__-table-head-row-expansion-column')).toBeDefined();
    expect(screen.getByTestId('table-head--overflow')).toBeDefined();
    userEvent.click(screen.getByTestId('table-head--overflow'));
    expect(
      screen.getByTestId(`__TABLE__-table-toolbar-toolbar-overflow-menu-item-aggregations`)
    ).toBeDefined();
  });

  it('limits the number of pagination select options', () => {
    // 100 records should have 10 pages. With max pages option we expect 5.
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={largeTableData}
        expandedData={expandedData}
        actions={mockActions}
        options={{ hasPagination: true }}
        view={{ ...view, pagination: { ...view.pagination, maxPages: 5 } }}
      />
    );
    expect(wrapper.find('.bx--select-option')).toHaveLength(5);
  });

  it('handles row collapse', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={tableData}
        expandedData={expandedData}
        actions={mockActions}
        options={options}
        view={view}
      />
    );
    wrapper.find('.bx--table-expand__button').at(0).simulate('click');
    expect(mockActions.table.onRowExpanded).toHaveBeenCalled();
  });

  it('handles row expansion', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={tableData}
        actions={mockActions}
        options={options}
        view={view}
      />
    );
    wrapper.find('.bx--table-expand__button').at(1).simulate('click');
    expect(mockActions.table.onRowExpanded).toHaveBeenCalled();
  });

  it('handles column sort', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={tableData}
        actions={mockActions}
        options={options}
        view={view}
      />
    );
    wrapper.find('button#column-string').simulate('click');
    expect(mockActions.table.onChangeSort).toHaveBeenCalled();
  });

  it('custom emptystate only renders with no filters', () => {
    const { rerender } = render(
      <Table
        columns={tableColumns}
        data={[]}
        actions={mockActions}
        options={options}
        view={merge({}, view, {
          table: { emptyState: <div id="customEmptyState">My empty state</div> },
        })}
      />
    );
    // Should render the custom empty state
    expect(screen.getByText('My empty state')).toBeTruthy();

    rerender(
      <Table
        columns={tableColumns}
        data={[]}
        actions={mockActions}
        options={options}
        i18n={{ emptyButtonLabelWithFilters: 'Clear all my filters' }}
        view={merge({}, view, {
          filters: [{ columnId: 'col', value: 'value' }],
          table: { emptyState: <div id="customEmptyState">My empty state</div> },
        })}
      />
    );
    // Should not render the empty state
    expect(screen.queryByText('My empty state')).not.toBeTruthy();

    userEvent.click(screen.getByRole('button', { name: 'Clear all my filters' }));
    expect(mockActions.toolbar.onApplySearch).toHaveBeenCalled();
    expect(mockActions.toolbar.onClearAllFilters).toHaveBeenCalled();
  });

  it('can handle missing actions for custom emptystate with filters', () => {
    render(
      <Table
        columns={tableColumns}
        data={[]}
        actions={{}}
        options={options}
        i18n={{ emptyButtonLabelWithFilters: 'Clear all my filters' }}
        view={merge({}, view, {
          filters: [{ columnId: 'col', value: 'value' }],
          table: { emptyState: <div id="customEmptyState">My empty state</div> },
        })}
      />
    );
    userEvent.click(screen.getByRole('button', { name: 'Clear all my filters' }));
    expect(mockActions.toolbar.onApplySearch).not.toHaveBeenCalled();
    expect(mockActions.toolbar.onClearAllFilters).not.toHaveBeenCalled();
  });

  it('triggers onColumnResize callback when column is toggled', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    const mockGetBoundingClientRect = jest.fn();
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    mockGetBoundingClientRect.mockImplementation(() => ({ width: 100 }));

    const ordering = [
      { columnId: 'col1', isHidden: false },
      { columnId: 'col2', isHidden: false },
      { columnId: 'col3', isHidden: false },
    ];
    const columns = [
      { id: 'col1', name: 'Column 1', width: '100px' },
      { id: 'col2', name: 'Column 2', width: '100px' },
      { id: 'col3', name: 'Column 3', width: '100px' },
    ];

    render(
      <Table
        columns={columns}
        data={[{ id: 'row-1', values: { col1: 'a', col2: 'b', col3: 'c' } }]}
        actions={mockActions}
        options={{ hasResize: true, hasColumnSelection: true }}
        view={{ table: { ordering }, toolbar: { activeBar: 'column' } }}
      />
    );

    const toggleHideCol2Button = screen.getAllByText('Column 2')[1];
    fireEvent.click(toggleHideCol2Button);

    expect(mockActions.table.onColumnResize).toHaveBeenCalledWith([
      { id: 'col1', name: 'Column 1', width: '150px' },
      { id: 'col2', name: 'Column 2', width: '100px' },
      { id: 'col3', name: 'Column 3', width: '150px' },
    ]);

    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it('does not trigger onColumnResize callback when column is toggled and preserveColumnWidths:true', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    const mockGetBoundingClientRect = jest.fn();
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    mockGetBoundingClientRect.mockImplementation(() => ({ width: 100 }));

    const ordering = [
      { columnId: 'col1', isHidden: false },
      { columnId: 'col2', isHidden: false },
      { columnId: 'col3', isHidden: false },
    ];
    const columns = [
      { id: 'col1', name: 'Column 1', width: '100px' },
      { id: 'col2', name: 'Column 2', width: '100px' },
      { id: 'col3', name: 'Column 3', width: '100px' },
    ];

    render(
      <Table
        columns={columns}
        data={[{ id: 'row-1', values: { col1: 'a', col2: 'b', col3: 'c' } }]}
        actions={mockActions}
        options={{ hasResize: true, hasColumnSelection: true, preserveColumnWidths: true }}
        view={{ table: { ordering }, toolbar: { activeBar: 'column' } }}
      />
    );

    const toggleHideCol2Button = screen.getAllByText('Column 2')[1];
    fireEvent.click(toggleHideCol2Button);

    expect(mockActions.table.onColumnResize).not.toHaveBeenCalled();

    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it('validate row count function ', () => {
    render(
      <Table
        columns={tableColumns}
        data={tableData}
        actions={mockActions}
        options={options}
        view={view}
      />
    );

    const rowCounts = view.pagination.totalItems;
    expect(screen.getByText(`Results: ${rowCounts}`)).toBeVisible();
  });

  it('validate show/hide hasRowCountInHeader property ', () => {
    const tableHeaderWrapper = mount(
      <TableToolbar actions={mockActions} options={options} tableState={tableState} />
    );
    //  Should render Row count label when hasRowCountInHeader (option) property is true
    const renderRowCountLabel = tableHeaderWrapper.find(
      `.${iotPrefix}--table-toolbar-secondary-title`
    );
    expect(renderRowCountLabel).toHaveLength(1);

    const tableHeaderWrapper2 = mount(
      <TableToolbar actions={mockActions} options={options2} tableState={tableState} />
    );
    //  Should not render Row count label when hasRowCountInHeader (option2) property is false
    const renderRowCountLabel2 = tableHeaderWrapper2.find(
      `.${iotPrefix}--table-toolbar-secondary-title`
    );
    expect(renderRowCountLabel2).toHaveLength(0);
  });

  it('click should trigger onDownload', () => {
    render(
      <TableToolbar actions={mockActions.toolbar} options={options2} tableState={tableState} />
    );

    const downloadButton = screen.getByTestId('download-button');
    expect(downloadButton).toBeTruthy();
    fireEvent.click(downloadButton);
    expect(mockActions.toolbar.onDownloadCSV).toHaveBeenCalledTimes(1);
  });

  it('click should trigger onColumnSelection', () => {
    render(
      <TableToolbar
        actions={mockActions.toolbar}
        options={{ hasColumnSelection: true }}
        tableState={tableState}
      />
    );

    const columnSelectButton = screen.getByTestId('column-selection-button');
    expect(columnSelectButton).toBeTruthy();
    fireEvent.click(columnSelectButton);
    expect(mockActions.toolbar.onToggleColumnSelection).toHaveBeenCalledTimes(1);
  });

  it('click should trigger onFilter', () => {
    render(
      <TableToolbar
        actions={mockActions.toolbar}
        options={{ hasFilter: true }}
        tableState={tableState}
      />
    );

    const filterButton = screen.getByTestId('filter-button');
    expect(filterButton).toBeTruthy();
    fireEvent.click(filterButton);
    expect(mockActions.toolbar.onToggleFilter).toHaveBeenCalledTimes(1);
  });

  it('mouse click should trigger rowEdit toolbar', () => {
    render(
      <TableToolbar
        actions={mockActions.toolbar}
        options={{ hasRowEdit: true }}
        tableState={tableState}
      />
    );

    const rowEditButton = screen.getByTestId('row-edit-button');
    expect(rowEditButton).toBeTruthy();

    fireEvent.click(rowEditButton);
    expect(mockActions.toolbar.onShowRowEdit).toHaveBeenCalledTimes(1);
  });

  it('rowEdit toolbar should contain external rowEditBarButtons', () => {
    render(
      <TableToolbar
        actions={mockActions.toolbar}
        options={{ hasRowEdit: true }}
        tableState={{
          ...tableState,
          activeBar: 'rowEdit',
          rowEditBarButtons: <button type="button" data-testid="row-edit-bar-button" />,
        }}
      />
    );

    const rowEditBarButton = screen.getByTestId('row-edit-bar-button');
    expect(rowEditBarButton).toBeTruthy();
  });

  it('toolbar search should render with default value', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={tableData}
        actions={mockActions}
        options={{
          hasSearch: true,
        }}
        view={{
          toolbar: {
            search: {
              defaultValue: '',
            },
          },
        }}
      />
    );

    expect(wrapper.find('.bx--search-input')).toHaveLength(1);
    expect(wrapper.find('.bx--search-input').prop('value')).toEqual('');

    wrapper.setProps({
      view: { toolbar: { search: { defaultValue: 'ferrari' } } },
    });
    wrapper.update();

    expect(wrapper.find('.bx--search-input').prop('value')).toEqual('ferrari');

    wrapper.setProps({ view: { toolbar: { search: { defaultValue: '' } } } });
    wrapper.update();

    expect(wrapper.find('.bx--search-input').prop('value')).toEqual('');
  });

  it('cells should always wrap by default', () => {
    const wrapper = mount(
      <Table columns={tableColumns} data={[tableData[0]]} options={{ hasResize: true }} />
    );
    expect(wrapper.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper.find(TableHead).prop('options').wrapCellText).toEqual('always');

    const wrapper2 = mount(
      <Table
        columns={tableColumns.map((col) => ({ ...col, width: '100px' }))}
        data={[tableData[0]]}
        options={{ hasResize: false }}
      />
    );
    expect(wrapper2.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper2.find(TableHead).prop('options').wrapCellText).toEqual('always');

    const wrapper3 = mount(<Table columns={tableColumns} data={[tableData[0]]} />);
    expect(wrapper3.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper3.find(TableHead).prop('options').wrapCellText).toEqual('always');
  });

  it('cells should truncate with wrapCellText:auto if resize or fixed col widths', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={[tableData[0]]}
        options={{ hasResize: true, wrapCellText: 'auto' }}
      />
    );
    expect(wrapper.find(TableBodyRow).prop('options').truncateCellText).toBeTruthy();
    expect(wrapper.find(TableHead).prop('options').truncateCellText).toBeTruthy();

    const wrapper2 = mount(
      <Table
        columns={tableColumns.map((col) => ({ ...col, width: '100px' }))}
        data={[tableData[0]]}
        options={{ hasResize: false, wrapCellText: 'auto' }}
      />
    );
    expect(wrapper2.find(TableBodyRow).prop('options').truncateCellText).toBeTruthy();
    expect(wrapper2.find(TableHead).prop('options').truncateCellText).toBeTruthy();

    const wrapper3 = mount(
      <Table
        columns={tableColumns.map((col) => ({
          ...col,
          width: undefined,
          renderDataFunction: () => 'hello this is a custom rendered long string',
        }))}
        data={[tableData[0]]}
        options={{ hasResize: false, wrapCellText: 'auto' }}
      />
    );
    expect(
      wrapper3
        .find('TableCell .iot--table__cell--truncate .iot--table__cell-text--truncate')
        .first()
    ).toHaveLength(1);
  });

  it('cells should wrap (not truncate) with wrapCellText:auto if no resize nor fixed col widths', () => {
    const wrapper3 = mount(
      <Table
        columns={tableColumns}
        data={[tableData[0]]}
        options={{ hasResize: false, wrapCellText: 'auto' }}
      />
    );
    expect(wrapper3.find(TableBodyRow).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper3.find(TableHead).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper3.find(TableBodyRow).prop('options').wrapCellText).toEqual('auto');
    expect(wrapper3.find(TableHead).prop('options').wrapCellText).toEqual('auto');
  });

  it('should render RowActionsCell dropdowns in the right direction for different language directions ', async () => {
    const id = 'TableId3';
    // Should render correctly by default even if no lang attribute exist
    const { unmount, rerender, baseElement } = render(
      <Table id={id} columns={tableColumns} data={[tableData[0]]} options={options} />
    );
    await fireEvent.click(screen.getByTestId(`${id}-row-0-row-actions-cell-overflow`));
    await waitFor(() => {
      // the menu is rendered via a portal outside of the container/screen
      expect(baseElement.querySelector('ul[role="menu"][class*=overflow-menu]')).toHaveClass(
        'bx--overflow-menu--flip'
      );
    });
    document.documentElement.setAttribute('dir', 'rtl');

    rerender(<Table id={id} columns={tableColumns} data={[tableData[1]]} options={options} />);
    await fireEvent.click(screen.getByTestId(`${id}-row-1-row-actions-cell-overflow`));
    await waitFor(() => {
      // the menu is rendered via a portal outside of the container/screen
      expect(baseElement.querySelector('ul[role="menu"][class*=overflow-menu]')).not.toHaveClass(
        'bx--overflow-menu--flip'
      );
    });

    // unmounting to be sure to clean up the documentElement
    unmount();
  });

  it('cells should wrap (not truncate) for wrapCellText:auto + resize + table-layout:auto', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={[tableData[0]]}
        options={{
          wrapCellText: 'auto',
          hasResize: true,
          useAutoTableLayoutForResize: true,
        }}
      />
    );
    expect(wrapper.find(TableBodyRow).prop('options').wrapCellText).toEqual('auto');
    expect(wrapper.find(TableHead).prop('options').wrapCellText).toEqual('auto');
    expect(wrapper.find(TableBodyRow).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper.find(TableHead).prop('options').truncateCellText).toBeFalsy();
  });

  it('cells should always wrap when wrapCellText is always', () => {
    const wrapper = mount(
      <Table
        columns={tableColumns}
        data={[tableData[0]]}
        options={{ hasResize: true, wrapCellText: 'always' }}
      />
    );
    expect(wrapper.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper.find(TableHead).prop('options').wrapCellText).toEqual('always');
    expect(wrapper.find(TableBodyRow).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper.find(TableHead).prop('options').truncateCellText).toBeFalsy();

    const wrapper2 = mount(
      <Table
        columns={tableColumns.map((col) => ({ ...col, width: '100px' }))}
        data={[tableData[0]]}
        options={{ wrapCellText: 'always' }}
      />
    );
    expect(wrapper2.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper2.find(TableHead).prop('options').wrapCellText).toEqual('always');
    expect(wrapper2.find(TableBodyRow).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper2.find(TableHead).prop('options').truncateCellText).toBeFalsy();

    const wrapper3 = mount(
      <Table columns={tableColumns} data={[tableData[0]]} options={{ wrapCellText: 'always' }} />
    );
    expect(wrapper3.find(TableBodyRow).prop('options').wrapCellText).toEqual('always');
    expect(wrapper3.find(TableHead).prop('options').wrapCellText).toEqual('always');
    expect(wrapper3.find(TableBodyRow).prop('options').truncateCellText).toBeFalsy();
    expect(wrapper3.find(TableHead).prop('options').truncateCellText).toBeFalsy();
  });

  describe('Text truncation and wrapping', () => {
    const columnHeaderText = 'String';
    const bodyRowCellText = 'toyota toyota toyota 0';
    const textTruncateClassName = `${iotPrefix}--table__cell-text--truncate`;
    const tdTruncateClassName = `${iotPrefix}--table__cell--truncate`;
    const textNoWrapClassName = `${iotPrefix}--table__cell-text--no-wrap`;

    const expectWrapping = () => {
      expect(screen.getByText(bodyRowCellText)).not.toHaveClass(textNoWrapClassName);
      expect(screen.getByText(columnHeaderText)).not.toHaveClass(textNoWrapClassName);
    };
    const expectExplicitNoWrapping = () => {
      expect(screen.getByText(bodyRowCellText)).toHaveClass(textNoWrapClassName);
      expect(screen.getByText(columnHeaderText)).toHaveClass(textNoWrapClassName);
    };
    const expectTruncation = (myBodyRowCellText = bodyRowCellText) => {
      expect(screen.getByText(myBodyRowCellText)).toHaveClass(textTruncateClassName);
      expect(screen.getByText(myBodyRowCellText).closest('td')).toHaveClass(tdTruncateClassName);
      expect(screen.getByText(columnHeaderText)).toHaveClass(textTruncateClassName);
    };
    const expectNoTruncation = () => {
      expect(screen.getByText(bodyRowCellText)).not.toHaveClass(textTruncateClassName);
      expect(screen.getByText(bodyRowCellText).closest('td')).not.toHaveClass(tdTruncateClassName);
      expect(screen.getByText(columnHeaderText)).not.toHaveClass(textTruncateClassName);
    };

    const renderDefaultTable = (options = {}, columns = tableColumns) => {
      render(<Table columns={columns} data={[tableData[0]]} options={options} />);
    };

    it('wraps cell text when there are no otions', () => {
      render(<Table columns={tableColumns} data={[tableData[0]]} options={false} />);
      expectWrapping();
      expectNoTruncation();
      expect.assertions(5);
    });

    it('wraps cell text by default', () => {
      renderDefaultTable();
      expectWrapping();
      expectNoTruncation();
      expect.assertions(5);
    });

    it('wraps cell text if resize & table-layout:auto', () => {
      renderDefaultTable({
        hasResize: true,
        useAutoTableLayoutForResize: true,
      });
      expectWrapping();
      expectNoTruncation();
      expect.assertions(5);
    });

    it('wraps cell text if hasResize', () => {
      renderDefaultTable({ hasResize: true });
      expectWrapping();
      expectNoTruncation();
      expect.assertions(5);
    });

    it('wraps cell text if column widths', () => {
      renderDefaultTable(
        {},
        tableColumns.map((col) => ({ ...col, width: '100px' }))
      );
      expectWrapping();
      expectNoTruncation();
      expect.assertions(5);
    });

    describe('wrapCellText:auto', () => {
      const renderAutoWrappingTable = (options = {}, columns = tableColumns) => {
        render(
          <Table
            columns={columns}
            data={[tableData[0]]}
            options={{ wrapCellText: 'auto', ...options }}
          />
        );
      };

      it('wraps cell text by default', () => {
        renderAutoWrappingTable();
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });

      it('wraps cell text if hasResize & table-layout:auto', () => {
        renderAutoWrappingTable({
          hasResize: true,
          useAutoTableLayoutForResize: true,
        });
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });

      it('truncates cell text if hasResize', () => {
        renderAutoWrappingTable({ hasResize: true });
        expectTruncation();
        expect.assertions(3);
      });

      it('truncates cell text if column widths', () => {
        renderAutoWrappingTable(
          {},
          tableColumns.map((col) => ({ ...col, width: '100px' }))
        );
        expectTruncation();
        expect.assertions(3);
      });

      it('truncates cell text if renderDataFunction & column widths present but undefined', () => {
        const customCellText = 'hello this is a custom rendered long string';
        renderAutoWrappingTable(
          {},
          tableColumns.map((col) => ({
            ...col,
            width: undefined,
            renderDataFunction: col.id === 'string' ? () => customCellText : undefined,
          }))
        );
        expectTruncation(customCellText);
        expect.assertions(3);
      });
    });

    describe('wrapCellText:always', () => {
      const renderAlwaysWrappingTable = (options = {}, columns = tableColumns) => {
        render(
          <Table
            columns={columns}
            data={[tableData[0]]}
            options={{ wrapCellText: 'always', ...options }}
          />
        );
      };

      it('wraps cell text by default', () => {
        renderAlwaysWrappingTable();
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });

      it('wraps cell text if hasResize & table-layout:auto', () => {
        renderAlwaysWrappingTable({
          hasResize: true,
          useAutoTableLayoutForResize: true,
        });
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });

      it('wraps cell text if hasResize', () => {
        renderAlwaysWrappingTable({ hasResize: true });
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });

      it('wraps cell text if column widths', () => {
        renderAlwaysWrappingTable(
          {},
          tableColumns.map((col) => ({ ...col, width: '100px' }))
        );
        expectWrapping();
        expectNoTruncation();
        expect.assertions(5);
      });
    });

    describe('wrapCellText:never', () => {
      const renderNeverWrappingTable = (options = {}, columns = tableColumns) => {
        render(
          <Table
            columns={columns}
            data={[tableData[0]]}
            options={{ wrapCellText: 'never', ...options }}
          />
        );
      };

      it('does not wrap cell text', () => {
        renderNeverWrappingTable();
        expectExplicitNoWrapping();
        expect.assertions(2);
      });

      it('truncates resize & table-layout:auto & column widths', () => {
        renderNeverWrappingTable(
          { hasResize: true, useAutoTableLayoutForResize: true },
          tableColumns.map((col) => ({ ...col, width: '100px' }))
        );
        expectTruncation();
        expect.assertions(3);
      });
    });

    describe('wrapCellText:alwaysTruncate', () => {
      const renderAlwaysTruncatTable = (options = {}, columns = tableColumns) => {
        render(
          <Table
            columns={columns}
            data={[tableData[0]]}
            options={{ wrapCellText: 'alwaysTruncate', ...options }}
          />
        );
      };

      it('truncates cell text', () => {
        renderAlwaysTruncatTable();
        expectTruncation();
        expect.assertions(3);
      });

      it('truncates cell text if table-layout:auto', () => {
        renderAlwaysTruncatTable({ useAutoTableLayoutForResize: true });
        expectTruncation();
        expect.assertions(3);
      });

      it('truncates cell text if renderDataFunction', () => {
        const customCellText = 'hello this is a custom rendered long string';
        renderAlwaysTruncatTable(
          {},
          tableColumns.map((col) => ({
            ...col,
            renderDataFunction: col.id === 'string' ? () => customCellText : undefined,
          }))
        );
        expectTruncation(customCellText);
        expect.assertions(3);
      });
    });
  });

  it('table should get row-actions HTML class only when rowActions are enabled', () => {
    const wrapper = mount(
      <Table columns={tableColumns} data={[tableData[0]]} options={{ hasRowActions: true }} />
    );
    expect(wrapper.exists(`table.${iotPrefix}--data-table--row-actions`)).toBeTruthy();

    const wrapper2 = mount(
      <Table columns={tableColumns} data={[tableData[0]]} options={{ hasRowActions: false }} />
    );
    expect(wrapper2.exists(`table.${iotPrefix}--data-table--row-actions`)).toBeFalsy();
  });

  it('i18n string test 1', () => {
    const additionalProps = {
      options: {
        ...initialState.options,
        hasRowActions: true,
        hasFilter: true,
        hasSingleRowEdit: true,
      },
      actions: {
        toolbar: {
          onDownloadCSV: () => {},
        },
      },
      view: {
        ...initialState.view,
        table: {
          expandedIds: ['row-3', 'row-7'],
          selectedIds: ['row-3', 'row-4'],
        },
      },
    };

    const { rerender } = render(
      <Table {...initialState} {...additionalProps} isSortable i18n={i18nTest} />
    );

    expect(screen.getAllByLabelText(i18nTest.overflowMenuAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.clickToExpandAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.clickToCollapseAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.selectAllAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.selectRowAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.downloadIconDescription)[0]).toBeInTheDocument();

    expect(screen.getAllByText(i18nTest.clearAllFilters)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.columnSelectionButtonAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.filterButtonAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.editButtonAria)[0]).toBeInTheDocument();
    expect(screen.getAllByText(i18nTest.searchLabel)[0]).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(i18nTest.searchPlaceholder)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(i18nTest.clearFilterAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.filterAria)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(i18nTest.openMenuAria)[0]).toBeInTheDocument();
    expect(screen.getAllByText(i18nTest.batchCancel)[0]).toBeInTheDocument();
    expect(screen.getByText(`2 ${i18nTest.itemsSelected}`)).toBeInTheDocument();

    expect(screen.queryByLabelText(i18nDefault.overflowMenuAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.clickToExpandAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.clickToCollapseAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.selectAllAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.selectRowAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.downloadIconDescription)).not.toBeInTheDocument();

    expect(screen.queryByText(i18nDefault.clearAllFilters)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.columnSelectionButtonAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.filterButtonAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.editButtonAria)).not.toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.searchLabel)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(i18nDefault.searchPlaceholder)).not.toBeInTheDocument();
    expect(screen.queryByTitle(i18nDefault.clearFilterAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.filterAria)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18nDefault.openMenuAria)).not.toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.batchCancel)).not.toBeInTheDocument();

    rerender(
      <Table
        {...initialState}
        options={{
          ...initialState.options,
          hasColumnSelectionConfig: true,
        }}
        i18n={i18nTest}
        view={{
          ...initialState.view,
          toolbar: {
            activeBar: 'column',
          },
          table: {
            selectedIds: ['row-3'],
          },
        }}
      />
    );
    expect(screen.getByText(`1 ${i18nTest.itemSelected}`)).toBeInTheDocument();
    expect(screen.getAllByText(i18nTest.columnSelectionConfig)[0]).toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.columnSelectionConfig)).not.toBeInTheDocument();
  });

  it('i18n string test 2', () => {
    const { rerender } = render(
      <Table
        columns={tableColumns}
        data={[]}
        view={{
          filters: [{ columnId: 'select', value: 'option-B' }],
        }}
        i18n={i18nTest}
        options={{
          hasFilter: true,
        }}
      />
    );
    expect(screen.getAllByText(i18nTest.emptyMessageWithFilters)[0]).toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.emptyMessageWithFilters)).not.toBeInTheDocument();

    rerender(
      <Table
        columns={tableColumns}
        data={[]}
        actions={{
          table: {
            onEmptyStateAction: () => {},
          },
        }}
        i18n={i18nTest}
      />
    );
    expect(screen.getAllByText(i18nTest.emptyMessage)[0]).toBeInTheDocument();
    expect(screen.getAllByText(i18nTest.emptyButtonLabel)[0]).toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.emptyMessage)).not.toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.emptyButtonLabel)).not.toBeInTheDocument();
  });

  it('has defaults for i18n functions', () => {
    const additionalProps = {
      options: {
        ...initialState.options,
        hasRowCountInHeader: true,
      },
      view: {
        ...initialState.view,
        table: {
          selectedIds: ['row-1', 'row-2'],
        },
      },
    };

    const { rerender } = render(<Table {...initialState} {...additionalProps} isSortable />);

    expect(screen.getByText(i18nDefault.itemsSelected(2))).toBeInTheDocument();
    expect(screen.getByText(i18nDefault.pageRange(1, 10))).toBeInTheDocument();
    expect(screen.getByText(i18nDefault.itemsRangeWithTotal(1, 10, 100))).toBeInTheDocument();
    expect(screen.getByText(i18nDefault.rowCountInHeader(100))).toBeInTheDocument();

    additionalProps.view.table.selectedIds = ['row-1'];
    rerender(<Table {...initialState} {...additionalProps} isSortable />);
    expect(screen.getByText(i18nDefault.itemSelected(1))).toBeInTheDocument();
  });

  it('supports external i18n functions', () => {
    const i18nFunctions = {
      itemSelected: (i) => `${i} test-item-selected`,
      itemsSelected: (i) => `${i} test-items-selected`,
      itemsRangeWithTotal: (min, max, total) => `${min}–${max} of ${total} test-items`,
      pageRange: (current, total) => `${current} of ${total} test-pages`,
      rowCountInHeader: (totalRowCount) => `test-results: ${totalRowCount}`,
    };

    const additionalProps = {
      options: {
        ...initialState.options,
        hasRowCountInHeader: true,
      },
      view: {
        ...initialState.view,
        table: {
          selectedIds: ['row-1', 'row-2'],
        },
      },
    };

    const { rerender } = render(
      <Table {...initialState} {...additionalProps} isSortable i18n={i18nFunctions} />
    );
    expect(screen.getByText(i18nFunctions.itemsSelected(2))).toBeInTheDocument();
    expect(screen.getByText(i18nFunctions.pageRange(1, 10))).toBeInTheDocument();
    expect(screen.getByText(i18nFunctions.itemsRangeWithTotal(1, 10, 100))).toBeInTheDocument();
    expect(screen.getByText(i18nFunctions.rowCountInHeader(100))).toBeInTheDocument();

    additionalProps.view.table.selectedIds = ['row-1'];
    rerender(<Table {...initialState} {...additionalProps} isSortable i18n={i18nFunctions} />);
    expect(screen.getByText(i18nFunctions.itemSelected(1))).toBeInTheDocument();
  });

  it('Table in modal select all', () => {
    const inModal = jest.fn();
    const notInModal = jest.fn();
    const table1Text = 'select1';
    const table2Text = 'select2;';
    render(
      <div>
        <Table
          id="tableid1"
          columns={tableColumns}
          data={[tableData[0]]}
          options={{ hasRowSelection: 'multi' }}
          actions={{ table: { onSelectAll: notInModal } }}
          i18n={{ selectAllAria: table1Text }}
        />
        <Modal open>
          <Table
            id="tableid2"
            columns={tableColumns}
            data={[tableData[0]]}
            options={{ hasRowSelection: 'multi' }}
            actions={{ table: { onSelectAll: inModal } }}
            i18n={{ selectAllAria: table2Text }}
          />
        </Modal>
      </div>
    );

    expect(inModal.mock.calls.length).toBe(0);
    expect(notInModal.mock.calls.length).toBe(0);
    fireEvent.click(screen.getByText(table2Text).parentElement);
    expect(inModal.mock.calls.length).toBe(1);
    expect(notInModal.mock.calls.length).toBe(0);
  });

  it('will fire row actions when Table is in modal', () => {
    const inModal = jest.fn();
    const { container } = render(
      <Modal open>
        <Table
          id="tableid1"
          columns={tableColumns}
          data={[
            {
              ...tableData[0],
              rowActions: [
                ...tableData[0].rowActions,
                {
                  id: 'drilldown',
                  renderIcon: ArrowRight16,
                  iconDescription: 'Drill in 2',
                  labelText: 'Drill in 2',
                  isOverflow: false,
                },
              ],
            },
          ]}
          options={{ hasRowActions: true }}
          actions={{ table: { onApplyRowAction: inModal } }}
        />
      </Modal>
    );

    expect(inModal.mock.calls.length).toBe(0);
    fireEvent.click(screen.getByText('Drill in 2').closest('button'));
    expect(inModal.mock.calls.length).toBe(1);
    fireEvent.click(container.querySelector('.iot--row-actions-cell--overflow-menu'));
    fireEvent.click(screen.queryByText('Drill in').closest('button'));
    expect(inModal.mock.calls.length).toBe(2);
  });

  it('calls onUserViewModified when view or columns prop changes', () => {
    const onUserViewModified = jest.fn();
    const { rerender } = render(
      <Table
        id="tableid1"
        columns={tableColumns}
        data={[tableData[0]]}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );
    // Modify data prop should NOT trigger calback
    rerender(
      <Table
        id="tableid1"
        columns={tableColumns}
        data={[tableData[1]]}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );
    expect(onUserViewModified).toHaveBeenCalledTimes(0);

    // Modify columns prop should trigger callback
    rerender(
      <Table
        id="tableid1"
        columns={[tableColumns[1]]}
        data={[tableData[0]]}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );
    expect(onUserViewModified).toHaveBeenCalledTimes(1);

    // Modify view prop should trigger callback
    rerender(
      <Table
        id="tableid1"
        view={{
          toolbar: {
            activeBar: 'filter',
          },
        }}
        columns={[tableColumns[1]]}
        data={[tableData[0]]}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );
    expect(onUserViewModified).toHaveBeenCalledTimes(2);
  });

  it('returns columns, view and search value in callback onUserViewModified', () => {
    const onUserViewModified = jest.fn();
    const updatedColumns = [tableColumns[1]];
    const expectedViewProps = defaultProps({ columns: updatedColumns }).view;
    expectedViewProps.pagination.totalItems = tableData.length;

    const { rerender } = render(
      <Table
        id="tableid1"
        columns={tableColumns}
        data={tableData}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );
    rerender(
      <Table
        id="tableid1"
        columns={updatedColumns}
        data={tableData}
        options={{ hasUserViewManagement: true }}
        actions={{ onUserViewModified }}
      />
    );

    expect(onUserViewModified).toHaveBeenCalledWith({
      columns: updatedColumns,
      state: { currentSearchValue: '' },
      view: expectedViewProps,
    });
  });

  it('renders header with overflow menu', () => {
    const overflowData = [
      {
        id: 'option-A',
        text: 'option-A',
      },
    ];

    render(
      <Table
        columns={tableColumns.map((col) => ({
          ...col,
          width: '100px',
        }))}
        data={tableData}
      />
    );

    expect(screen.queryAllByTestId('table-head--overflow').length).toBe(0);

    render(
      <Table
        columns={tableColumns.map((col) => ({
          ...col,
          width: '100px',
          overflowMenuItems: overflowData,
        }))}
        data={tableData}
      />
    );

    expect(screen.queryAllByTestId('table-head--overflow').length).toBe(5);
  });

  describe('Row selection', () => {
    const getTableColumns = () => [
      {
        id: 'string',
        name: 'String',
        isSortable: false,
      },
    ];

    it('selects all child rows when a parent row is selected', () => {
      const onRowSelectedMock = jest.fn();
      render(
        <Table
          columns={getTableColumns()}
          data={getNestedRows()}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: [],
              expandedIds: ['row-0', 'row-1', 'row-1_B', 'row-1_B-2', 'row-1_D'],
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );

      const row0Checkbox = screen.getAllByLabelText(i18nDefault.selectRowAria)[
        getNestedRowIds().indexOf('row-0')
      ];
      fireEvent.click(row0Checkbox);
      expect(onRowSelectedMock).toHaveBeenCalledWith('row-0', true, [
        'row-0',
        'row-0_A',
        'row-0_B',
      ]);

      const row1Checkbox = screen.getAllByLabelText(i18nDefault.selectRowAria)[
        getNestedRowIds().indexOf('row-1')
      ];
      fireEvent.click(row1Checkbox);
      expect(onRowSelectedMock).toHaveBeenCalledWith('row-1', true, [
        'row-1',
        'row-1_A',
        'row-1_B',
        'row-1_B-1',
        'row-1_B-2',
        'row-1_B-2-A',
        'row-1_B-2-B',
        'row-1_B-3',
        'row-1_C',
        'row-1_D',
        'row-1_D-1',
        'row-1_D-2',
        'row-1_D-3',
      ]);
    });

    it('selects the parent if all child rows are selected', () => {
      const onRowSelectedMock = jest.fn();
      const { rerender } = render(
        <Table
          columns={getTableColumns()}
          data={getNestedRows()}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: ['row-0_A'],
              expandedIds: ['row-0', 'row-1', 'row-1_B', 'row-1_B-2', 'row-1_D'],
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );

      fireEvent.click(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[getNestedRowIds().indexOf('row-0_B')]
      );

      expect(onRowSelectedMock).toHaveBeenCalledWith('row-0_B', true, [
        'row-0',
        'row-0_A',
        'row-0_B',
      ]);

      rerender(
        <Table
          columns={getTableColumns()}
          data={getNestedRows()}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: [
                'row-1_A',
                'row-1_B-1',
                'row-1_B-2-B',
                'row-1_B-3',
                'row-1_C',
                'row-1_D',
                'row-1_D-1',
                'row-1_D-2',
                'row-1_D-3',
              ],
              expandedIds: ['row-0', 'row-1', 'row-1_B', 'row-1_B-2', 'row-1_D'],
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );

      fireEvent.click(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[
          getNestedRowIds().indexOf('row-1_B-2-A')
        ]
      );

      expect(onRowSelectedMock).toHaveBeenCalledWith('row-1_B-2-A', true, [
        'row-1',
        'row-1_A',
        'row-1_B',
        'row-1_B-1',
        'row-1_B-2',
        'row-1_B-2-A',
        'row-1_B-2-B',
        'row-1_B-3',
        'row-1_C',
        'row-1_D',
        'row-1_D-1',
        'row-1_D-2',
        'row-1_D-3',
      ]);
    });

    it('deselects all child rows and parent rows when a row is deselected', () => {
      const onRowSelectedMock = jest.fn();
      const allRows = getNestedRows();
      const row0AndChildren = ['row-0', 'row-0_A', 'row-0_B'];
      const row1AndChildren = [
        'row-1',
        'row-1_A',
        'row-1_B',
        'row-1_B-1',
        'row-1_B-2',
        'row-1_B-2-A',
        'row-1_B-2-B',
        'row-1_B-3',
        'row-1_C',
        'row-1_D',
        'row-1_D-1',
        'row-1_D-2',
        'row-1_D-3',
      ];
      const expandedIds = ['row-0', 'row-1', 'row-1_B', 'row-1_B-2', 'row-1_D'];
      const { rerender } = render(
        <Table
          columns={getTableColumns()}
          data={allRows}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: [...row0AndChildren, ...row1AndChildren],
              expandedIds,
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );

      const row0Checkbox = screen.getAllByLabelText(i18nDefault.selectRowAria)[
        getNestedRowIds().indexOf('row-0')
      ];
      fireEvent.click(row0Checkbox);
      expect(onRowSelectedMock).toHaveBeenCalledWith('row-0', false, [...row1AndChildren]);

      rerender(
        <Table
          columns={tableColumns}
          data={getNestedRows()}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: [...row1AndChildren],
              expandedIds,
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );

      const row1BCheckbox = screen.getAllByLabelText(i18nDefault.selectRowAria)[
        getNestedRowIds().indexOf('row-1_B')
      ];
      fireEvent.click(row1BCheckbox);

      expect(onRowSelectedMock).toHaveBeenCalledWith('row-1_B', false, [
        'row-1_A',
        'row-1_C',
        'row-1_D',
        'row-1_D-1',
        'row-1_D-2',
        'row-1_D-3',
      ]);
    });

    it('shows selected as indeterminate if some but not all children are selected', () => {
      const onRowSelectedMock = jest.fn();
      render(
        <Table
          columns={getTableColumns()}
          data={getNestedRows()}
          options={{ hasRowSelection: 'multi', hasRowNesting: true }}
          view={{
            table: {
              selectedIds: ['row-0_B', 'row-1_B-2-B'],
              expandedIds: ['row-0', 'row-1', 'row-1_B', 'row-1_B-2', 'row-1_D'],
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );
      expect(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[getNestedRowIds().indexOf('row-0')]
      ).toBePartiallyChecked();
      expect(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[getNestedRowIds().indexOf('row-1')]
      ).toBePartiallyChecked();
      expect(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[getNestedRowIds().indexOf('row-1_B')]
      ).toBePartiallyChecked();
      expect(
        screen.getAllByLabelText(i18nDefault.selectRowAria)[getNestedRowIds().indexOf('row-1_B-2')]
      ).toBePartiallyChecked();
    });

    it('new selection replaces previous in single hasRowSelection mode', () => {
      const onRowSelectedMock = jest.fn();
      const initialSelection = ['row-0'];
      render(
        <Table
          columns={getTableColumns()}
          data={getNestedRows()}
          options={{ hasRowSelection: 'single', hasRowNesting: false }}
          view={{
            table: {
              selectedIds: initialSelection,
            },
          }}
          actions={{ table: { onRowSelected: onRowSelectedMock } }}
        />
      );
      const row1 = screen.getByText('row-1');
      fireEvent.click(row1);
      expect(onRowSelectedMock).toHaveBeenCalledWith('row-1', true, ['row-1']);
    });

    it('automatically checks "select all" if all rows are selected', () => {
      const rows = tableData.slice(0, 5);
      const selectedIds = rows.map((row) => row.id);
      const { rerender } = render(
        <Table
          id="tableid1"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: { selectedIds },
          }}
        />
      );

      const selectAllCheckbox = screen.getByLabelText('Select all items');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).toHaveProperty('checked', true);

      rerender(
        <Table
          id="tableid2"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: { selectedIds: selectedIds.slice(1, 5) },
          }}
        />
      );
      expect(screen.getByLabelText('Select all items')).toHaveProperty('checked', false);
    });

    it('overrides automatic "select all" check if "isSelectAllSelected" is used', () => {
      const rows = tableData.slice(0, 5);
      const selectedIds = rows.map((row) => row.id);
      const { rerender } = render(
        <Table
          id="tableid1"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: {
              selectedIds: selectedIds.slice(1, 5),
              isSelectAllSelected: true,
            },
          }}
        />
      );

      const selectAllCheckbox = screen.getByLabelText('Select all items');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).toHaveProperty('checked', true);

      rerender(
        <Table
          id="tableid2"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: { selectedIds, isSelectAllSelected: false },
          }}
        />
      );
      expect(screen.getByLabelText('Select all items')).toHaveProperty('checked', false);
    });

    it('automatically marks "select all" as Indeterminate if some but not all rows are selected', () => {
      const rows = tableData.slice(0, 5);
      const selectedIds = rows.map((row) => row.id);
      const onApplyBatchAction = jest.fn();
      const { rerender } = render(
        <Table
          id="tableid1"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: { selectedIds: selectedIds.slice(1, 5) },
            toolbar: {
              batchActions: [
                {
                  id: 'test-batch-action',
                  labelText: 'test batch action',
                  iconDescription: 'test batch action',
                },
              ],
            },
          }}
          actions={{
            toolbar: {
              onApplyBatchAction,
            },
          }}
        />
      );

      const selectAllCheckbox = screen.getByLabelText('Select all items');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).toHaveProperty('indeterminate', true);

      // add extra check to ensure onApplyBatchAction is called correctly to help
      // us meet test requirements.
      const alertAction = screen.getByRole('button', { name: 'test batch action' });
      expect(alertAction).toBeVisible();
      userEvent.click(alertAction);
      expect(onApplyBatchAction).toHaveBeenCalledWith('test-batch-action');

      rerender(
        <Table
          id="tableid2"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: { selectedIds },
          }}
        />
      );
      expect(screen.getByLabelText('Select all items')).toHaveProperty('indeterminate', false);
    });

    it('overrides automatically indeterminate state for "select all" if "isSelectAllSelected" or "isSelectAllIndeterminate" is used', () => {
      const rows = tableData.slice(0, 5);
      const selectedIds = rows.map((row) => row.id);
      const selectionThatWouldCauseAnIndeterminateState = selectedIds.slice(1, 5);
      const { rerender } = render(
        <Table
          id="tableid1"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: {
              selectedIds: selectionThatWouldCauseAnIndeterminateState,
              isSelectAllSelected: false,
            },
          }}
        />
      );

      const selectAllCheckbox = screen.getByLabelText('Select all items');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).toHaveProperty('indeterminate', false);

      rerender(
        <Table
          id="tableid2"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: {
              selectedIds: selectionThatWouldCauseAnIndeterminateState,
              isSelectAllSelected: true,
            },
          }}
        />
      );
      expect(screen.getByLabelText('Select all items')).toHaveProperty('indeterminate', false);

      rerender(
        <Table
          id="tableid3"
          columns={tableColumns}
          data={rows}
          options={{ hasRowSelection: 'multi' }}
          view={{
            table: {
              selectedIds: selectionThatWouldCauseAnIndeterminateState,
              isSelectAllIndeterminate: false,
            },
          }}
        />
      );
      expect(screen.getByLabelText('Select all items')).toHaveProperty('indeterminate', false);
    });
  });

  describe('Foot', () => {
    const tableTestId = 'test';
    const tableFootTestId = 'table-foot-aggregation';
    const columnId = 'number';

    it('shows aggregation for specified columns with sum as default', () => {
      render(
        <Table
          id={tableTestId}
          columns={tableColumns}
          data={tableData}
          options={{ hasAggregations: true }}
          view={{
            aggregations: { columns: [{ id: columnId }] },
          }}
        />
      );

      expect(
        screen.getByTestId(`${tableTestId}-${tableFootTestId}-${columnId}`).textContent
      ).toEqual('2470');
    });

    it('shows aggregation for specified columns using custom aggregation function', () => {
      const sumFunction = jest.fn((values) => {
        const sum = values.reduce((total, num) => total + num, 0);
        return `${sum + 1}`;
      });

      const onToggleAggregations = jest.fn();

      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          tooltip="this is a tooltip"
          options={{ hasAggregations: true }}
          actions={{
            toolbar: {
              onToggleAggregations,
            },
          }}
          view={{
            aggregations: {
              columns: [
                {
                  id: columnId,
                  value: sumFunction,
                },
              ],
            },
          }}
          i18n={{
            toggleAggregations: '__Toggle aggregations__',
          }}
        />
      );

      expect(
        screen.getByTestId(`${tableTestId}-${tableFootTestId}-${columnId}`).textContent
      ).toEqual('2471');
      expect(sumFunction).toHaveBeenCalled();

      const overflow = screen.getByTestId('table-head--overflow');

      userEvent.click(overflow);

      userEvent.click(screen.getByText('__Toggle aggregations__'));
      expect(onToggleAggregations).toHaveBeenCalled();

      // simple extra test to confirm the tooltip is there and help us
      // meet testing requirements.
      const buttons = screen.getAllByRole('button');
      const tooltipButton = buttons.find((button) =>
        button.classList.contains(`${prefix}--tooltip__trigger`)
      );

      expect(tooltipButton).toBeInTheDocument();
      userEvent.click(tooltipButton);
      expect(screen.getByText('this is a tooltip')).toBeVisible();
    });
  });

  describe('TableToolbarAdvancedFilterFlyout', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    beforeAll(() => {
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        x: 900,
        y: 300,
        height: 200,
        width: 400,
        top: 300,
        bottom: 500,
        left: 500,
        right: 900,
      }));
    });
    afterAll(() => {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });
    it('throws an error when using both hasFilter and hasAdvancedFilter props', () => {
      const { __DEV__ } = global;
      global.__DEV__ = true;
      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          options={{ hasFilter: true, hasAdvancedFilter: true }}
        />
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Only one of props 'options.hasFilter' or 'options.hasAdvancedFilter' can be specified in 'Table'.`
        )
      );
      global.__DEV__ = __DEV__;
    });

    it('throws an error when hasAdvancedFilter is not boolean or undefined', () => {
      const { __DEV__ } = global;
      global.__DEV__ = true;
      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          options={{ hasAdvancedFilter: 'true' }}
        />
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`'options.hasAdvancedFilter' should be a boolean or undefined.`)
      );
      global.__DEV__ = __DEV__;
    });

    it('shows the filter button when hasAdvancedFilter is true and onToggleFilter is called on click', () => {
      const handleToggleFilters = jest.fn();
      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          actions={{
            toolbar: {
              onToggleAdvancedFilter: handleToggleFilters,
            },
          }}
          options={{ hasAdvancedFilter: true }}
        />
      );
      const filterButton = screen.getByTestId('advanced-filter-flyout-button');
      expect(filterButton).toBeVisible();
      userEvent.click(filterButton);
      expect(handleToggleFilters).toHaveBeenCalledTimes(1);
    });

    it('handles the callbacks for the advancedfilterflyout properly', () => {
      const handleApplyFilter = jest.fn();
      const handleCancelFilter = jest.fn();
      const handleRemoveAdvancedFilter = jest.fn();
      const handleCreateAdvancedFilter = jest.fn();
      const handleChangeAdvancedFiler = jest.fn();
      const handleToggleFilter = jest.fn();
      const { rerender } = render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          actions={{
            toolbar: {
              onApplyAdvancedFilter: handleApplyFilter,
              onCancelAdvancedFilter: handleCancelFilter,
              onRemoveAdvancedFilter: handleRemoveAdvancedFilter,
              onCreateAdvancedFilter: handleCreateAdvancedFilter,
              onChangeAdvancedFilter: handleChangeAdvancedFiler,
              onToggleAdvancedFilter: handleToggleFilter,
            },
          }}
          options={{ hasAdvancedFilter: true }}
          view={{
            toolbar: {
              advancedFilterFlyoutOpen: true,
            },
          }}
        />
      );
      const filterButton = screen.getByTestId('advanced-filter-flyout-button');
      const filterFlyout = screen.getByTestId('advanced-filter-flyout');
      expect(filterButton).toBeVisible();
      expect(filterFlyout).toHaveAttribute('open');
      userEvent.click(filterButton);
      expect(handleToggleFilter).toHaveBeenCalledTimes(1);
      // it should still be open b/c this component is controlled via the advancedFilterFlyoutOpen prop
      expect(filterFlyout).toHaveAttribute('open');

      userEvent.click(screen.getByTestId('flyout-menu-apply'));
      expect(handleApplyFilter).toBeCalledWith({
        simple: {},
        advanced: {
          filterIds: [],
        },
      });
      userEvent.click(screen.getByTestId('flyout-menu-cancel'));
      expect(handleCancelFilter).toBeCalledTimes(1);
      userEvent.click(screen.getByRole('tab', { name: 'Advanced filters' }));
      userEvent.click(screen.getByRole('button', { name: 'create a new advanced filter' }));
      expect(handleCreateAdvancedFilter).toBeCalledTimes(1);
      expect(screen.getByText('Select a filter')).toBeVisible();

      rerender(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          actions={{
            toolbar: {
              onApplyAdvancedFilter: handleApplyFilter,
              onCancelAdvancedFilter: handleCancelFilter,
              onRemoveAdvancedFilter: handleRemoveAdvancedFilter,
              onCreateAdvancedFilter: handleCreateAdvancedFilter,
              onChangeAdvancedFilter: handleChangeAdvancedFiler,
              onToggleAdvancedFilter: handleToggleFilter,
            },
          }}
          options={{ hasAdvancedFilter: true }}
          view={{
            toolbar: {
              advancedFilterFlyoutOpen: false,
            },
          }}
        />
      );
      expect(screen.queryByTestId('advanced-filter-flyout')).toBeNull();
    });

    it('calls onApplyFilter when simple filters are updated.', async () => {
      const handleApplyFilter = jest.fn();
      const handleCancelFilter = jest.fn();
      const handleRemoveAdvancedFilter = jest.fn();
      const handleCreateAdvancedFilter = jest.fn();
      const handleChangeAdvancedFiler = jest.fn();
      const handleToggleFilter = jest.fn();
      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          actions={{
            toolbar: {
              onApplyAdvancedFilter: handleApplyFilter,
              onCancelAdvancedFilter: handleCancelFilter,
              onRemoveAdvancedFilter: handleRemoveAdvancedFilter,
              onCreateAdvancedFilter: handleCreateAdvancedFilter,
              onChangeAdvancedFilter: handleChangeAdvancedFiler,
              onToggleAdvancedFilter: handleToggleFilter,
            },
          }}
          options={{
            hasAdvancedFilter: true,
          }}
          view={{
            filters: [
              {
                columnId: 'string',
                value: 'whiteboard',
              },
              {
                columnId: 'select',
                value: 'option-B',
              },
            ],
            advancedFilters: [
              {
                filterId: 'my-filter',
                filterTitleText: 'My Filter',
              },
              {
                filterId: 'next-filter',
                filterTitleText: 'Next Filter',
              },
            ],
            toolbar: {
              advancedFilterFlyoutOpen: true,
            },
          }}
        />
      );
      userEvent.click(screen.getAllByRole('button', { name: 'Clear filter' })[0]);
      fireEvent.change(screen.getByPlaceholderText('pick a number'), { target: { value: '16' } });
      // ensure keyDown events also get called with hasFastFilter is false
      fireEvent.keyDown(screen.getByPlaceholderText('pick a number'), {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        charCode: 13,
      });
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        advanced: {
          filterIds: [],
        },
        simple: {
          string: '',
          select: 'option-B',
          number: '16',
        },
      });
      userEvent.click(screen.getAllByRole('button', { name: 'Clear selection' })[0]);
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        advanced: {
          filterIds: [],
        },
        simple: {
          string: '',
          select: '',
          number: '16',
        },
      });
      const withinFlyout = within(screen.getByTestId('advanced-filter-flyout'));
      userEvent.click(screen.getByPlaceholderText('pick an option'));
      userEvent.click(withinFlyout.getByText('option-A'));
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        advanced: {
          filterIds: [],
        },
        simple: {
          string: '',
          select: 'option-A',
          number: '16',
        },
      });
      userEvent.click(screen.getByRole('tab', { name: 'Advanced filters' }));
      userEvent.click(screen.getByText('Select a filter'));
      userEvent.click(withinFlyout.getByText('My Filter'));
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        simple: {
          string: '',
          select: 'option-A',
          number: '16',
        },
        advanced: {
          filterIds: ['my-filter'],
        },
      });
    });

    it('calls onApplyFilter when fastfiltering is enabled', async () => {
      const handleApplyFilter = jest.fn();
      const handleCancelFilter = jest.fn();
      const handleRemoveAdvancedFilter = jest.fn();
      const handleCreateAdvancedFilter = jest.fn();
      const handleChangeAdvancedFiler = jest.fn();
      const handleToggleFilter = jest.fn();
      render(
        <Table
          id="test"
          columns={tableColumns}
          data={tableData}
          actions={{
            toolbar: {
              onApplyAdvancedFilter: handleApplyFilter,
              onCancelAdvancedFilter: handleCancelFilter,
              onRemoveAdvancedFilter: handleRemoveAdvancedFilter,
              onCreateAdvancedFilter: handleCreateAdvancedFilter,
              onChangeAdvancedFilter: handleChangeAdvancedFiler,
              onToggleAdvancedFilter: handleToggleFilter,
            },
          }}
          options={{
            hasAdvancedFilter: 'onKeyPress',
          }}
          view={{
            filters: [
              {
                columnId: 'string',
                value: 'whiteboard',
              },
              {
                columnId: 'select',
                value: 'option-B',
              },
            ],
            selectedAdvancedFilterIds: ['my-filter'],
            advancedFilters: [
              {
                filterId: 'my-filter',
                filterTitleText: 'My Filter',
              },
              {
                filterId: 'next-filter',
                filterTitleText: 'Next Filter',
              },
            ],
            toolbar: {
              advancedFilterFlyoutOpen: true,
            },
          }}
        />
      );

      fireEvent.focus(screen.getByPlaceholderText('pick a number'));
      fireEvent.change(screen.getByPlaceholderText('pick a number'), { target: { value: '16' } });
      fireEvent.blur(screen.getByPlaceholderText('pick a number'));
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        advanced: {
          filterIds: ['my-filter'],
        },
        simple: {
          string: 'whiteboard',
          select: 'option-B',
          number: '16',
        },
      });
      const numberInputClear = screen.getAllByRole('button', { name: 'Clear filter' })[1];
      fireEvent.focus(numberInputClear);
      fireEvent.keyDown(numberInputClear, {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        charCode: 13,
      });
      userEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
      expect(handleApplyFilter).toHaveBeenLastCalledWith({
        advanced: {
          filterIds: ['my-filter'],
        },
        simple: {
          string: 'whiteboard',
          select: 'option-B',
          number: '',
        },
      });
    });
  });

  it('should render a loading state without columns', () => {
    const { container } = render(
      <Table
        id="loading-table"
        columns={[]}
        data={[]}
        view={{ table: { loadingState: { isLoading: true, rowCount: 10, columnCount: 3 } } }}
      />
    );

    const headerRows = container.querySelectorAll(
      `.${iotPrefix}--table-skeleton-with-headers--table-row--head`
    );
    expect(headerRows).toHaveLength(1);
    expect(headerRows[0].querySelectorAll('td')).toHaveLength(3);

    const allRows = container.querySelectorAll(
      `.${iotPrefix}--table-skeleton-with-headers--table-row`
    );
    expect(allRows).toHaveLength(10);
  });

  it('should show data after loading is finished', () => {
    const { container, rerender } = render(
      <Table
        id="loading-table"
        columns={[]}
        data={[]}
        view={{ table: { loadingState: { isLoading: true, rowCount: 10, columnCount: 3 } } }}
      />
    );

    const allRows = container.querySelectorAll(
      `.${iotPrefix}--table-skeleton-with-headers--table-row`
    );
    expect(allRows).toHaveLength(10);
    expect(screen.queryByTitle('String')).toBeNull();
    expect(screen.queryByTitle('Date')).toBeNull();

    rerender(
      <Table
        id="loading-table"
        columns={tableColumns}
        data={tableData}
        view={{ table: { loadingState: { isLoading: false, rowCount: 10, columnCount: 3 } } }}
      />
    );
    expect(
      container.querySelectorAll(`.${iotPrefix}--table-skeleton-with-headers--table-row`)
    ).toHaveLength(0);

    // 20 rows plus the header
    expect(container.querySelectorAll('tr')).toHaveLength(21);
    expect(screen.getByTitle('String')).toBeVisible();
    expect(screen.getByTitle('Date')).toBeVisible();
  });
});
