import React from 'react';
import { mount } from 'enzyme';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fileDownload from 'js-file-download';

import Table from '../Table/Table';
import { barChartData } from '../../utils/barChartDataSample';
import { BAR_CHART_LAYOUTS, BAR_CHART_TYPES } from '../../constants/LayoutConstants';

import BarChartCard from './BarChartCard';
import * as barChartUtils from './barChartUtils';

jest.mock('js-file-download');

const barChartCardProps = {
  title: 'Sample',
  id: 'sample-bar-chart',
  isLoading: false,
  content: {
    xLabel: 'Cities',
    yLabel: 'Particles',
    series: [
      {
        dataSourceId: 'particles',
      },
    ],
    categoryDataSourceId: 'city',
    layout: BAR_CHART_LAYOUTS.VERTICAL,
    type: BAR_CHART_TYPES.SIMPLE,
    decimalPrecision: 3,
  },
  values: barChartData.quarters.filter((q) => q.quarter === '2020-Q1'),
  breakpoint: 'lg',
  size: 'LARGE',
  onCardAction: () => {},
};

/*
  FYI: the underlying Carbon Charts controls have been mocked.
  Check __mocks__/@carbon/charts-react/ for details
*/

describe('BarChartCard', () => {
  it('is selectable with either testID or testId', () => {
    const { rerender } = render(<BarChartCard {...barChartCardProps} testID="BAR-CHART-CARD" />);
    expect(screen.getByTestId('BAR-CHART-CARD')).toBeTruthy();
    rerender(<BarChartCard {...barChartCardProps} testId="barchart-card" />);
    expect(screen.getByTestId('barchart-card')).toBeTruthy();
  });

  it('does not show bar chart when loading', () => {
    const wrapper = mount(<BarChartCard {...barChartCardProps} isLoading />);
    expect(wrapper.find('#mock-bar-chart-simple')).toHaveLength(0);
  });

  it('does not show bar chart when empty data', () => {
    const wrapper = mount(
      <BarChartCard
        {...barChartCardProps}
        values={barChartData.quarters.filter((q) => q.quarter === 'NOT_VALID')}
      />
    );
    expect(wrapper.find('#mock-bar-chart-simple')).toHaveLength(0);
  });

  it('shows table when isExpanded', () => {
    const wrapper = mount(<BarChartCard {...barChartCardProps} isExpanded />);
    expect(wrapper.find(Table)).toHaveLength(1);
  });

  it('onCsvDownload should fire when download button is clicked', async () => {
    render(<BarChartCard {...barChartCardProps} isExpanded />);
    // First check that the button appeared
    const downloadBtn = screen.getByTestId('download-button');
    expect(downloadBtn).toBeTruthy();
    // click the button
    userEvent.click(downloadBtn);
    // This means the csvDownloadHandler is firing
    expect(fileDownload).toHaveBeenCalledWith(
      `Amsterdam,New York,Bangkok,San Francisco\n447,528,435,388,\n`,
      'Sample.csv'
    );
  });

  it('shows groupedBarChart on grouped data', () => {
    const wrapper = mount(
      <BarChartCard
        {...barChartCardProps}
        content={{
          type: BAR_CHART_TYPES.GROUPED,
          xLabel: 'Cities',
          yLabel: 'Total',
          series: [
            {
              dataSourceId: 'particles',
              label: 'Particles',
              color: 'blue',
            },
            {
              dataSourceId: 'temperature',
              label: 'Temperature',
            },
          ],
          categoryDataSourceId: 'city',
        }}
        values={barChartData.quarters.filter((a) => a.quarter === '2020-Q1')}
      />
    );
    expect(wrapper.find('#mock-bar-chart-grouped')).toHaveLength(1);
  });

  it('shows stackedBarChart', () => {
    const wrapper = mount(
      <BarChartCard
        {...barChartCardProps}
        content={{
          type: BAR_CHART_TYPES.STACKED,
          layout: BAR_CHART_LAYOUTS.VERTICAL,
          xLabel: 'Cities',
          yLabel: 'Total',
          series: [
            {
              dataSourceId: 'particles',
              label: 'Particles',
            },
            {
              dataSourceId: 'temperature',
              label: 'Temperature',
            },
          ],
          categoryDataSourceId: 'city',
        }}
        values={barChartData.quarters.filter((a) => a.quarter === '2020-Q3')}
      />
    );
    expect(wrapper.find('#mock-bar-chart-stacked')).toHaveLength(1);
  });

  it('shows a timeSeries chart', () => {
    const wrapper = mount(
      <BarChartCard
        {...barChartCardProps}
        content={{
          xLabel: 'Date',
          yLabel: 'Particles',
          series: [
            {
              dataSourceId: 'particles',
              label: 'Particles',
            },
          ],
          timeDataSourceId: 'timestamp',
          type: BAR_CHART_TYPES.STACKED,
        }}
        values={barChartData.timestamps.filter((t) => t.city === 'Amsterdam')}
      />
    );
    expect(wrapper.find('#mock-bar-chart-stacked')).toHaveLength(1);
  });

  it('shows a horizontal chart', () => {
    const wrapper = mount(
      <BarChartCard
        {...barChartCardProps}
        content={{
          xLabel: 'Cities',
          yLabel: 'Particles',
          series: [
            {
              dataSourceId: 'particles',
              color: {
                Amsterdam: 'yellow',
                'New York': 'yellow',
                Bangkok: 'red',
                'San Francisco': 'pink',
              },
            },
          ],
          categoryDataSourceId: 'city',
          layout: BAR_CHART_LAYOUTS.HORIZONTAL,
          type: BAR_CHART_TYPES.GROUPED,
        }}
        values={barChartData.quarters.filter((a) => a.quarter === '2020-Q1')}
      />
    );
    expect(wrapper.find('#mock-bar-chart-grouped')).toHaveLength(1);
  });

  it('i18n string test', () => {
    const i18nTest = {
      noDataLabel: 'no-data-label',
    };

    const i18nDefault = BarChartCard.defaultProps.i18n;

    render(<BarChartCard {...barChartCardProps} values={[]} i18n={i18nTest} />);
    expect(screen.getByText(i18nTest.noDataLabel)).toBeInTheDocument();
    expect(screen.queryByText(i18nDefault.noDataLabel)).not.toBeInTheDocument();
  });

  it('should use generated values if isDashboardPreview or isEditor and series is not empty', () => {
    jest.spyOn(barChartUtils, 'generateSampleValuesForEditor');
    const { rerender } = render(<BarChartCard {...barChartCardProps} isDashboardPreview />);
    expect(barChartUtils.generateSampleValuesForEditor).toHaveBeenCalledWith(
      [{ dataSourceId: 'particles' }],
      undefined,
      undefined,
      undefined,
      'city',
      undefined
    );

    rerender(<BarChartCard {...barChartCardProps} isDashboardPreview={false} isEditable />);
    expect(barChartUtils.generateSampleValuesForEditor).toHaveBeenCalledWith(
      [{ dataSourceId: 'particles' }],
      undefined,
      undefined,
      undefined,
      'city',
      undefined
    );
    jest.resetAllMocks();
  });
});
