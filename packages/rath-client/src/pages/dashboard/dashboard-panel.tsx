import { ActionButton, ChoiceGroup, IChoiceGroupOption, Stack, Text, TextField } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useState } from "react";
import styled from "styled-components";
import { DashboardCardAppearance, DashboardCardInsetLayout, DashboardCardState, DashboardDocument, DashboardDocumentOperators } from "../../store/dashboardStore";
import { useGlobalStore } from "../../store";
import SourcePanel from "./source-panel";
import FilterList from './filter-list';
import EditPanel from "./edit-panel";


const Panel = styled.div`
    position: relative;
    width: 33%;
    min-width: 360px;
    background-color: #fff;
    border-radius: 2px;
    margin-block: 10px;
    padding: 1em;
    overflow: auto;
    box-shadow:
        -9px 1.6px 6.4px 0 rgb(0 0 0 / 5%), -1px 0.3px 0.9px 0 rgb(0 0 0 / 11%),
        -9px -1.6px 6.4px 0 rgb(0 0 0 / 5%), -1px -0.3px 0.9px 0 rgb(0 0 0 / 11%);

    & *[role=tablist] {
        display: flex;
        flex-direction: row;
        --corner-radius: 0.5em;
        --border-color: #444;
        --bgColor: #fff;

        & *[role=tab] {
            border: 1px solid var(--border-color);
            border-left: none;
            user-select: none;
            line-height: 1.2em;
            padding: 0.2em calc(1.25em + var(--corner-radius)) 0.4em 0.6em;
            border-radius: var(--corner-radius) var(--corner-radius) 0 0;
            position: relative;
            background-color: var(--bgColor);

            &:first-child, &[aria-selected=true] {
                border-left: 1px solid var(--border-color);
            }
            &:not(:first-child) {
                margin-left: calc(-2 * var(--corner-radius));
                padding: 0.2em calc(1.25em + var(--corner-radius)) 0.4em calc(0.6em + var(--corner-radius));
            }
            &[aria-selected=false] {
                cursor: pointer;
            }
            &[aria-disabled=true] {
                opacity: 0.6;
            }
            &[aria-selected=true] {
                border-bottom-color: var(--bgColor);
                cursor: default;
            }
        }
        ::after {
            content: "";
            display: block;
            flex-grow: 1;
            flex-shrink: 1;
            border-bottom: 1px solid var(--border-color);
        }
    }
    & *[role=tabpanel] {
        flex-grow: 1;
        flex-shrink: 1;
        margin-top: 1em;
        overflow: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
    }
`;

const OptionContainer = styled.div`
    > button {
        position: absolute;
        top: 0;
        right: 0;
        margin-inline: 1em;
        height: unset;
        font-size: 90%;
    }
`;

export interface DashboardPanelProps {
    page: DashboardDocument;
    operators: DashboardDocumentOperators;
    card: DashboardCardState | null;
    sampleSize: number;
}

const SupportedTabs = ['collection', 'editor'/*, 'loa' */] as const;

const CardThemes: readonly DashboardCardAppearance[] = [
    DashboardCardAppearance.Transparent,
    DashboardCardAppearance.Outline,
    DashboardCardAppearance.Dropping,
    DashboardCardAppearance.Neumorphism,
];

const CardAlignTypes: readonly DashboardCardInsetLayout[] = [
    DashboardCardInsetLayout.Auto,
    DashboardCardInsetLayout.Column,
    DashboardCardInsetLayout.Row,
];

const CardAlignName: Readonly<Record<DashboardCardInsetLayout, string>> = {
    [DashboardCardInsetLayout.Auto]: 'Auto',
    [DashboardCardInsetLayout.Column]: 'Column',
    [DashboardCardInsetLayout.Row]: 'Row',
};

const DashboardPanel: FC<DashboardPanelProps> = ({ page, card, operators, sampleSize }) => {
    const { dashboardStore } = useGlobalStore();
    const [tab, setTab] = useState<typeof SupportedTabs[number]>('collection');

    const themeOptions = useCallback((mode: 'single' | 'global') => CardThemes.map<IChoiceGroupOption>(thm => ({
        key: thm,
        text: thm,
        onRenderField: (option, origin) => {
            const applyToAll = () => {
                const key = option?.key ?? '';
                if ((CardThemes as string[]).includes(key)) {
                    dashboardStore.runInAction(() => {
                        page.cards.forEach(c => c.config.appearance = key as DashboardCardAppearance);
                    });
                }
            };
            return option ? mode === 'single' ? (
                <OptionContainer>
                    {origin?.(option)}
                    <ActionButton onClick={applyToAll}>
                        Apply to all
                    </ActionButton>
                </OptionContainer>
            ) : (
                <ActionButton onClick={applyToAll} style={{ height: 'unset' }}>
                    {option.text}
                </ActionButton>
            ) : null;
        },
    })), [page, dashboardStore]);

    const layoutOptions = useCallback((mode: 'single' | 'global') => CardAlignTypes.map<IChoiceGroupOption>(alg => ({
        key: CardAlignName[alg],
        text: CardAlignName[alg],
        onRenderField: (option, origin) => {
            const applyToAll = () => {
                const key = {
                    Auto: DashboardCardInsetLayout.Auto,
                    Column: DashboardCardInsetLayout.Column,
                    Row: DashboardCardInsetLayout.Row,
                }[option?.key ?? ''];
                if (typeof key === 'number') {
                    dashboardStore.runInAction(() => {
                        page.cards.forEach(c => c.config.align = key);
                    });
                }
            };
            return option ? mode === 'single' ? (
                <OptionContainer>
                    {origin?.(option)}
                    <ActionButton onClick={applyToAll}>
                        Apply to all
                    </ActionButton>
                </OptionContainer>
            ) : (
                <ActionButton onClick={applyToAll} style={{ height: 'unset' }}>
                    {option.text}
                </ActionButton>
            ) : null;
        },
    })), [page, dashboardStore]);

    return (
        <Panel onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <Stack>
                {card ? (
                    <>
                        <Text block variant="xLarge" style={{ margin: '0 0 0.5em' }}>
                            Common
                        </Text>
                        <TextField
                            label="Title"
                            value={card.content.title ?? ''}
                            onChange={(_, d) => dashboardStore.runInAction(() => {
                                card.content.title = d || undefined;
                            })}
                        />
                        <TextField
                            label="Description"
                            value={card.content.text ?? ''}
                            onChange={(_, d) => dashboardStore.runInAction(() => {
                                card.content.text = d || undefined;
                            })}
                            multiline
                            autoAdjustHeight
                            resizable={false}
                        />
                        <ChoiceGroup
                            label="Theme"
                            selectedKey={card.config.appearance}
                            options={themeOptions('single')}
                            onChange={(_, option) => dashboardStore.runInAction(() => {
                                const key = option?.key ?? '';
                                if ((CardThemes as string[]).includes(key)) {
                                    card.config.appearance = key as DashboardCardAppearance;
                                }
                            })}
                        />
                        <ChoiceGroup
                            label="Layout"
                            selectedKey={CardAlignName[card.config.align]}
                            options={layoutOptions('single')}
                            onChange={(_, option) => dashboardStore.runInAction(() => {
                                const key = {
                                    Auto: DashboardCardInsetLayout.Auto,
                                    Column: DashboardCardInsetLayout.Column,
                                    Row: DashboardCardInsetLayout.Row,
                                }[option?.key ?? ''];
                                if (typeof key === 'number') {
                                    card.config.align = key;
                                }
                            })}
                        />
                        <Text block variant="xLarge" style={{ margin: '1.5em 0 0.5em' }}>
                            Chart
                        </Text>
                        <div role="tablist">
                            {SupportedTabs.map((key, i) => (
                                <div
                                    role="tab"
                                    key={key}
                                    aria-selected={key === tab}
                                    onClick={() => key !== tab && setTab(key)}
                                    style={{ zIndex: key === tab ? SupportedTabs.length + 1 : SupportedTabs.length - i }}
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                        <div role="tabpanel">
                            {({
                                collection: <SourcePanel page={page} card={card} operators={operators} sampleSize={sampleSize} />,
                                editor: <EditPanel page={page} card={card} operators={operators} sampleSize={sampleSize} />,
                                loa: null,      // TODO:
                            } as const)[tab]}
                        </div>
                    </>
                ) : (
                    <>
                        <Text block variant="xLarge" style={{ margin: '0 0 0.5em' }}>
                            Global
                        </Text>
                        <ChoiceGroup
                            label="Theme"
                            options={themeOptions('global')}
                        />
                        <ChoiceGroup
                            label="Layout"
                            options={layoutOptions('global')}
                        />
                        <Text block variant="xLarge" style={{ margin: '1.5em 0 0.5em' }}>
                            Filters
                        </Text>
                        <FilterList page={page} operators={operators} />
                    </>
                )}
            </Stack>
        </Panel>
    );
};


export default observer(DashboardPanel);