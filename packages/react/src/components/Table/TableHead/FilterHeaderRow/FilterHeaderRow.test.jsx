import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from '../../../../utils/componentUtilityFunctions';
import { settings } from '../../../../constants/Settings';

import FilterHeaderRow from './FilterHeaderRow';

const { iotPrefix } = settings;

describe('FilterHeaderRow', () => {
  const commonFilterProps = { onApplyFilter: jest.fn() };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockClear();
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  it('should be selectable by testId', () => {
    render(
      <FilterHeaderRow
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }]}
        columns={[{ id: 'col1', isFilterable: true }]}
        testId="filter_header_row"
      />
    );
    expect(screen.getByTestId('filter_header_row')).toBeDefined();
  });

  it('text input change updates state', () => {
    render(
      <FilterHeaderRow
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }]}
        columns={[{ id: 'col1', isFilterable: true }]}
      />
    );

    const input = screen.getByPlaceholderText('Type and hit enter to apply');
    userEvent.type(input, 'mytext');
    expect(input).toHaveValue('mytext');
  });

  it('each column is marked with data-column', () => {
    const { container } = render(
      <FilterHeaderRow
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }]}
        columns={[{ id: 'col1' }]}
      />
    );
    const columns = container.querySelectorAll("th[data-column='col1']");
    expect(columns).toHaveLength(1);
  });

  it('text input clear button clears filter', () => {
    render(
      <FilterHeaderRow
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }]}
        columns={[{ id: 'col1' }]}
      />
    );
    const input = screen.getByPlaceholderText('Type and hit enter to apply');
    userEvent.type(input, 'mytext');
    expect(input).toHaveValue('mytext');
    userEvent.click(screen.getByTitle('Clear filter'));
    expect(input).toHaveValue('');
  });

  it('filter input is hidden when isFilterable is false', () => {
    render(
      <FilterHeaderRow
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }]}
        columns={[{ id: 'col1', isFilterable: false }]}
      />
    );
    expect(screen.queryByPlaceholderText('Type and hit enter to apply')).not.toBeInTheDocument();
  });

  it('prevent filter modifications when isDisabled is true ', () => {
    const { container } = render(
      <FilterHeaderRow
        {...commonFilterProps}
        isDisabled
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[{ id: 'col1' }, { id: 'col2', options: [{ id: 'opt1', text: 'option1' }] }]}
        filters={[{ columnId: 'col1', value: 'myVal' }]}
      />
    );

    expect(screen.getByPlaceholderText('Type and hit enter to apply')).toHaveAttribute('disabled');
    expect(screen.getByPlaceholderText('Choose an option')).toHaveAttribute('disabled');
    expect(
      container.querySelectorAll(`.${iotPrefix}--clear-filters-button--disabled`)
    ).toHaveLength(1);

    userEvent.click(screen.getByTitle('Clear filter'));
    expect(screen.getByTitle('myVal')).toHaveValue('myVal');
  });

  it('adds an extra cell for the expander column when showExpanderColumn is true', () => {
    const { container, rerender } = render(
      <FilterHeaderRow
        showExpanderColumn={false}
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[{ id: 'col1' }, { id: 'col2' }]}
        filters={[]}
      />
    );
    expect(container.querySelectorAll('th').length).toEqual(3);

    rerender(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[{ id: 'col1' }, { id: 'col2' }]}
        filters={[]}
      />
    );
    expect(container.querySelectorAll('th').length).toEqual(4);
  });

  it('should derive the new state when new filters are given by props', () => {
    const { rerender } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        filters={[
          {
            columnId: 'col1',
            value: 'test1',
          },
        ]}
      />
    );

    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[0]).toHaveValue('test1');
    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[1]).toHaveValue('');

    rerender(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        filters={[
          {
            columnId: 'col1',
            value: 'test1',
          },
          {
            columnId: 'col2',
            value: 'test2',
          },
        ]}
      />
    );

    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[0]).toHaveValue('test1');
    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[1]).toHaveValue('test2');
    // hitting buttons other than enter doesn't clear the filters
    fireEvent.keyDown(screen.getAllByTitle('Clear filter')[0], {
      keyCode: 27,
      key: 'Escape',
    });
    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[0]).toHaveValue('test1');
    fireEvent.keyDown(screen.getAllByTitle('Clear filter')[0], {
      keyCode: 13,
      key: 'Enter',
    });
    expect(screen.getAllByPlaceholderText('Type and hit enter to apply')[0]).toHaveValue('');
  });

  it('should fallback to hard-coded i18n strings on multiselect when i18n props in columns are falsey', () => {
    render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }, { columnId: 'col3' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
          {
            id: 'col3',
            isFilterable: true,
            isMultiselect: true,
            options: [
              {
                id: 'one',
                text: 'One',
              },
              {
                id: 'two',
                text: 'Two',
              },
              {
                id: 'three',
                text: 'Three',
              },
            ],
          },
        ]}
        filters={[
          {
            columnId: 'col1',
            value: 'test1',
          },
          {
            columnId: 'col2',
            value: 'test2',
          },
        ]}
      />
    );

    expect(screen.getByPlaceholderText('Choose an option')).toBeVisible();
    userEvent.click(screen.getByPlaceholderText('Choose an option'));
    userEvent.click(screen.getByLabelText('Three'));
    userEvent.click(screen.getByPlaceholderText('Choose an option'));
    userEvent.click(screen.getByLabelText('Two'));
    expect(screen.getByText('2')).toBeVisible();
  });

  it('call onChange in a ComboBox to set the filters', () => {
    render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }, { columnId: 'col3' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
          {
            id: 'col3',
            isFilterable: true,
            options: [
              {
                id: 'one',
                text: 'One',
              },
              {
                id: 'two',
                text: 'Two',
              },
              {
                id: 'three',
                text: 'Three',
              },
            ],
          },
        ]}
        filters={[
          {
            columnId: 'col1',
            value: 'test1',
          },
          {
            columnId: 'col2',
            value: 'test2',
          },
        ]}
      />
    );

    expect(screen.getByPlaceholderText('Choose an option')).toBeVisible();
    userEvent.click(screen.getByPlaceholderText('Choose an option'));
    userEvent.click(screen.getByText('Three'));
    expect(screen.getByPlaceholderText('Choose an option')).toHaveValue('Three');
  });

  it('should apply filters on Enter if !hasFastFilter', () => {
    render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }, { columnId: 'col3' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
          {
            id: 'col3',
            isFilterable: true,
            options: [
              {
                id: 'one',
                text: 'One',
              },
              {
                id: 'two',
                text: 'Two',
              },
              {
                id: 'three',
                text: 'Three',
              },
            ],
          },
        ]}
        filters={[
          {
            columnId: 'col1',
            value: 'test1',
          },
          {
            columnId: 'col2',
            value: 'test2',
          },
        ]}
        hasFastFilter={false}
      />
    );

    const input = screen.getByTitle('test2');
    userEvent.clear(input);
    jest.spyOn(utils, 'handleEnterKeyDown');
    userEvent.type(input, 'test-2{enter}');
    expect(input).toHaveValue('test-2');
    expect(utils.handleEnterKeyDown).toHaveBeenCalled();
    jest.resetAllMocks();
  });

  it("should not display a header when hasRowSelection !== 'multi'", () => {
    const { container } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        tableOptions={{
          hasRowSelection: 'single',
        }}
      />
    );

    expect(container.querySelectorAll('th')).toHaveLength(3);
  });

  it('should display an extra header when hasRowExpansion', () => {
    const { container } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        tableOptions={{
          hasRowSelection: 'single',
          hasRowExpansion: true,
        }}
        isVisible
      />
    );

    expect(container.querySelectorAll('th')).toHaveLength(4);
  });

  it('should display an extra header when hasRowActions', () => {
    const { container } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        tableOptions={{
          hasRowSelection: 'single',
          hasRowActions: true,
        }}
        isVisible
      />
    );

    expect(container.querySelectorAll('th')).toHaveLength(4);
  });

  it('should display three extra headers when all tableOptions are supplied', () => {
    const { container } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        tableOptions={{
          hasRowSelection: 'multi',
          hasRowActions: true,
          hasRowExpansion: true,
        }}
        isVisible
      />
    );

    expect(container.querySelectorAll('th')).toHaveLength(6);
  });
  it('should nothing when isVisible is false', () => {
    const { container } = render(
      <FilterHeaderRow
        showExpanderColumn
        {...commonFilterProps}
        ordering={[{ columnId: 'col1' }, { columnId: 'col2' }]}
        columns={[
          { id: 'col1', isFilterable: true },
          { id: 'col2', isFilterable: true },
        ]}
        tableOptions={{
          hasRowSelection: 'multi',
          hasRowActions: true,
          hasRowExpansion: true,
        }}
        isVisible={false}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
